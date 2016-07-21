'use strict';
var file = require('./file');
var find = file.find;
var request = require('superagent');
var parseXMLString = require('xml2js');
var _ = require('lodash');
var fs = require('fs');

var app;
var loopTimer;
var loopStates = {};
let playbackSpeed = 100;
let path = find.GetProjectName();

var WSGCodeIndex = 0;
var WSGCode = [];

var MTCHold = {};
///*******************************************************************\
//|                                                                    |
//|                       Helper Functions                             |
//|                                                                    |
//\*******************************************************************/

var update = (val) => {
  app.ioServer.emit('nc:state', val);
};

var updateSpeed = (speed) => {
  app.ioServer.emit('nc:speed', speed);
};

var MTListen = function() {
  var resCoords = [];
  var xOffset;
  var yOffset;
  var zOffset;
  var currentgcode;
  var feedrate;

  return new Promise(function(resolve) {
    let mtc = request.get('http://192.168.0.123:5000/current');
    mtc.end(function (err, res) {
      if (err || !res.ok) {
        return;
      }
      parseXMLString.parseString(res.text, function (error, result) {
        let find = result['MTConnectStreams']['Streams'][0];
        find = find['DeviceStream'][0]['ComponentStream'];
        let pathtag = _.find(find, function(tag) {
          if (tag['$']['name'] === 'path') {
            return true;
          } else {
            return false;
          }
        });
        resCoords = pathtag.Samples[0].PathPosition[0]._.split(' ');
        feedrate = pathtag['Samples'][0]['PathFeedrate'][1]['_'];

        if (pathtag['Events'][0]['Block']) {
          currentgcode = pathtag['Events'][0]['Block'][0]['_'];
        } else {
          currentgcode = pathtag['Events'][0]['e:BlockNumber'][0]['_'];
        }

        let xTag = _.find(pathtag['Events'][0]['e:Variables'], function(tag) {
          if (tag['$']['subType'] === 'x:WORKOFFSET_X_AXIS') {
            return true;
          } else {
            return false;
          }
        });
        xOffset = parseInt(xTag['_']);

        let yTag = _.find(pathtag['Events'][0]['e:Variables'], function(tag) {
          if (tag['$']['subType'] === 'x:WORKOFFSET_X_AXIS') {
            return true;
          } else {
            return false;
          }
        });

        yOffset = parseInt(yTag['_']);

        let zTag = _.find(pathtag['Events'][0]['e:Variables'], function(tag) {
          if (tag['$']['subType'] === 'x:WORKOFFSET_X_AXIS') {
            return true;
          } else {
            return false;
          }
        });
        zOffset = parseInt(zTag['_']);

        currentgcode = pathtag['Events'][0]['e:BlockNumber'][0]['_'];
      });

      var coords = [];
      coords[0] = parseInt(resCoords[0]);
      coords[1] = parseInt(resCoords[1]);
      coords[2] = parseInt(resCoords[2]);

      let mtc = request.get('http://192.168.0.123:5000/');
      mtc.end(function (err, res) {
        parseXMLString.parseString(res.text, function (error, result) {
          let ret = result['MTConnectDevices']['Devices'][0]['Device'][0]['Components'][0]['Controller'][0]['Components'][0]['Path'][0]['DataItems'][0]['DataItem'];
          let feedrateUnits = _.find(ret, function(dataitem){
            if(dataitem['$'].type === 'PATH_FEEDRATE'){
              return true;
            }
            else{
              return false;
            }
          });
          resolve([coords, xOffset, yOffset, zOffset, currentgcode, feedrate, feedrateUnits['$']['units']]);
        });
      });
    });
  });
};

var findWS = function(current) {
  var change = false;

  if (current >= WSGCode['worksteps'][WSGCodeIndex]) {
    if (WSGCodeIndex >= WSGCode['worksteps'].length) {
      WSGCodeIndex = 0;
    } else {
      WSGCodeIndex = WSGCodeIndex + 1;
    }
    console.log('GCODE Switched!');
    return true;
  }

  while (current < WSGCode['worksteps'][WSGCodeIndex - 1]) {
    if (WSGCodeIndex >= WSGCode['worksteps'].length) {
      WSGCodeIndex = 0;
    } else {
      WSGCodeIndex = WSGCodeIndex + 1;
    }
    change = true;
  }
  return change;
};

//TODO: Get rid of this function and consolidate with endpoint functions
var _getDelta = function(ms, key, cb) {
  let holder = '';
  let theQuestion = MTListen();

  theQuestion.then(function(res) {
    MTCHold.feedrate = 'Not defined';
    MTCHold.gcode = 'Not defined';
    MTCHold.spindleSpeed = 'Not defined';
    MTCHold.feedrate = res[5];
    MTCHold.feedrateUnits = res[6];
    MTCHold.gcode = WSGCode['GCode'][res[4]];
    if (findWS(res[4]) ) {
      console.log('keystate');
      ms.NextWS();
      holder = JSON.parse(ms.GetKeystateJSON());
      holder.next = true;
    } else {
      console.log('delta');
      holder = JSON.parse(ms.GetDeltaJSON());
      holder.next = false;
    }
    holder.mtcoords = res[0];
    holder.offset = [res[1], res[2], res[3]];
    holder.gcode = res[4];
    holder.feed = res[5];
    let response = JSON.stringify(holder);
    //app.logger.debug('got ' + response);
    cb(response);
  });
};

var getNext = function(ms, cb) {
  ms.NextWS();
  cb();
};

var getPrev = function(ms, cb) {
  ms.PrevWS();
  cb();
};

var getToWS = function(wsId, ms, cb) {
  ms.GoToWS(wsId);
  //assume switch was successful
  app.logger.debug('Switched! ' + wsId);
  cb();
};

var loop = function(ms, key, wsgcode) {
  if (loopStates[path] === true) {
    app.logger.debug('Loop step ' + path);
    _getDelta(ms, key, function(b) {
      app.ioServer.emit('nc:delta', JSON.parse(b));
      if (playbackSpeed > 0) {
        if (loopTimer !== undefined) {
          clearTimeout(loopTimer);
        }
        loopTimer = setTimeout(() => loop(ms, false), 50/(playbackSpeed/200));
      }
    });
  }
};

var parseGCodes = function() {
  let GCodeFile = app.project.substring(0, app.project.length - 5) + 'min';
  let MTCfile = app.project.substring(0, app.project.length - 5) + 'mtc';
  let lineNumber = 0;

  let fileRead = new Promise(function(resolve) {
    var MTCcontent = [];
    var GCcontent = [];
    fs.readFile(GCodeFile, function(err, res) {
      var GCodes = null;
      if (res) {
        GCodes = res.toString().split('\n');
      }
      _.each(GCodes, function(line) {
        if (line[0] === '(') {
          if (line.substring(1, 12) === 'WORKINGSTEP') {
            console.log(lineNumber);
            MTCcontent.push(lineNumber);
          }
        } else {
          GCcontent.push(line);
          lineNumber++;
        }
      });
      resolve([MTCcontent, GCcontent]);
    });
  });

  fileRead.then(function(res) {
    res[0].shift();

    var JSONContent = '{\"worksteps\" : [\n';
    _.each(res[0], function(code) {
      JSONContent = JSONContent + code.toString() + ',\n';
    });
    JSONContent = JSONContent.substring(0, JSONContent.length - 2)  + '\n],';

    fs.writeFile(MTCfile, JSONContent, (err) => {
      console.log(err);
    });

    JSONContent = JSONContent + '\n\n\"GCode\" : [\n';
    _.each(res[1], function(code) {
      JSONContent = JSONContent + '\"' + code.toString().substring(0, code.toString().length - 1) + '\",\n';
    });
    JSONContent = JSONContent.substring(0, JSONContent.length - 2)  + '\n]}';

    fs.writeFile(MTCfile, JSONContent, (err) => {
      console.log(err);
    });
    MTCHold.gcode = WSGCode['GCode'][MTCHold.gcode];
  });
};

///*******************************************************************\
//|                                                                    |
//|                       Endpoint Functions                           |
//|                                                                    |
//\*******************************************************************/

var _loopInit = function(req, res) {
  // app.logger.debug('loopstate is ' + req.params.loopstate);
  let MTCfile = app.project.substring(0, app.project.length - 5) + 'mtc';

  fs.readFile(MTCfile, function(err, data) {
    if (err) {
      WSGCode = parseGCodes();
    } else {
      if (data) {
        WSGCode = JSON.parse(data.toString());
        MTCHold.gcode = WSGCode['GCode'][MTCHold.gcode];
      }
    }

    if (req.params.loopstate === undefined) {
      if (loopStates[path] === true) {
        res
          .status(200)
          .send(JSON.stringify({'state': 'play', 'speed': playbackSpeed}));
      } else {
        res
          .status(200)
          .send(JSON.stringify({'state': 'pause', 'speed': playbackSpeed}));
      }
    } else {
      let loopstate = req.params.loopstate;
      var ms = file.ms;
      if (typeof loopStates[path] === 'undefined') {
        loopStates[path] = false;
      }

      switch (loopstate) {
        case 'start':
          if (loopStates[path] === true) {
            res.status(200).send('Already running');
            return;
          }
          // app.logger.debug('Looping ' + path);
          loopStates[path] = true;
          res.status(200).send('OK');
          update('play');
          loop(ms, false, JSON.parse(data.toString()));
          break;
        case 'stop':
          if (loopStates[path] === false) {
            res.status(200).send('Already stopped');
            return;
          }
          loopStates[path] = false;
          update('pause');
          res.status(200).send('OK');
          break;
        default:
          if (!isNaN(parseFloat(loopstate)) && isFinite(loopstate)) {
            let newSpeed = Number(loopstate);
            if (Number(playbackSpeed) !== newSpeed) {
              playbackSpeed = newSpeed;
              // app.logger.debug('Changing speed to ' + newSpeed);
            }
            if (loopStates[path] === true) {
              loop(ms, false, JSON.parse(data.toString()));
              res
                .status(200)
                .send(JSON.stringify({
                  'state': 'play',
                  'speed': playbackSpeed,
                }));
            } else {
              res
                .status(200)
                .send(JSON.stringify({
                  'state': 'pause',
                  'speed': playbackSpeed,
                }));
            }
            updateSpeed(playbackSpeed);
          }
      }
    }
  });
};

var _wsInit = function(req, res) {
  if (req.params.command) {
    let command = req.params.command;
    var ms = file.ms;
    if (typeof loopStates[path] === 'undefined') {
      loopStates[path] = false;
    }

    switch (command) {
      case 'next':
        var temp = loopStates[path];
        loopStates[path] = true;
        if (temp) {
          getNext(ms, function() {
            loop(ms, true);
          });
        } else {
          loop(ms,false);
          getNext(ms, function() {
            loop(ms, true);
          });
          loopStates[path] = false;
          update('pause');
        }
        res.status(200).send('OK');
        break;
      case 'prev':
        var temp = loopStates[path];
        loopStates[path] = true;
        if (temp) {
          getPrev(ms, function() {
            loop(ms, true);
          });
        } else {
          loop(ms,false);
          getPrev(ms, function() {
            loop(ms, true);
          });
          loopStates[path] = false;
          update('pause');
        }
        res.status(200).send('OK');
        break;
      default:
        if (!isNaN(parseFloat(command)) && isFinite(command)) {
          let ws = Number(command);
          temp = loopStates[path];
          loopStates[path] = true;
          if (temp) {
            getToWS(ws, ms, function() {
              loop(ms, true);
            });
            loopStates[path] = false;
            update('pause');
          } else {
            loop(ms,false);
            getToWS(ws, ms, function() {
              loop(ms, true);
            });
            loopStates[path] = false;
            update('pause');
          }
          res.status(200).send('OK');
        }
    }
    _getDelta(ms, false, function(b) {
      app.ioServer.emit('nc:delta', JSON.parse(b));
      if (playbackSpeed > 0) {
        if (loopTimer !== undefined) {
          clearTimeout(loopTimer);
        }
        loopTimer = setTimeout(() => loop(ms, false), 50/(playbackSpeed/200));
      } else {
        // app.logger.debug('playback speed is zero, no timeout set');
      }
    });
  }
};

var _getKeyState = function (req, res) {
  var ms = file.ms;
  if (ms === undefined) {
    res.status(404).send('Machine state could not be found');
    return;
  }
  res.status(200).send(ms.GetKeystateJSON());
};

var _getDeltaState = function (req, res) {
  var ms = file.ms;
  if (ms === undefined) {
    res.status(404).send('Machine state could not be found');
    return;
  }
  res.status(200).send(ms.GetDeltaJSON());
};

var _getMTCHold = function (req, res) {
  res.status(200).send(MTCHold);
};

module.exports = function(globalApp, cb) {
  app = globalApp;
  app.router.get('/v3/nc/state/key', _getKeyState);
  app.router.get('/v3/nc/state/delta', _getDeltaState);
  app.router.get('/v3/nc/state/loop/:loopstate', _loopInit);
  app.router.get('/v3/nc/state/loop/', _loopInit);
  app.router.get('/v3/nc/state/ws/:command', _wsInit);
  app.router.get('/v3/nc/state/mtc', _getMTCHold);
  if (cb) {
    cb();
  }
};
