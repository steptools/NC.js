"use strict";
var StepNC = require('../../../../../STEPNode/build/Release/StepNC');
var file = require('./file');
var find = file.find;

var app;
var loopTimer;
var loopStates = {};
let playbackSpeed = 100;
let path = find.GetProjectName();

var update = (val) => {
  app.ioServer.emit("nc:state", val);
};

var _updateSpeed = (speed) => {
  app.ioServer.emit("nc:speed", speed);
};

var MTListen = function() {
  var coords = "";
  return new Promise(function(resolve, reject) {
    let mtc = request.get("http://192.168.0.123:5000/current");
    mtc.end(function (err, res) {
      parseXMLString.parseString(res.text, function (error, result) {
        coords = result.MTConnectStreams.Streams[0].DeviceStream[0].ComponentStream[3].Samples[0].PathPosition[0]._.split(" ");
      });
      console.log(coords);
      resolve(coords);
    });
  });
}

//TODO: Get rid of this function and consolidate with endpoint functions if possible
var _getDelta = function(ms, key, cb) {
  let holder = "";
  if (key) {
    holder = JSON.parse(ms.GetKeystateJSON());
    holder["project"] = ncId;
    //response = JSON.stringify(holder);
  }
  else {
    holder = JSON.parse(ms.GetDeltaJSON());
    holder["project"] = ncId;
    //response = JSON.stringify(holder);
  }

  let theQuestion = MTListen();
  theQuestion.then(function(result) {
    holder.mtcoords = result;
    let response = JSON.stringify(holder);
    //app.logger.debug("got " + response);
    cb(response);
  });
};

var _getNext = function(ms, cb) {
  ms.NextWS();
  //assume switch was successful
  app.logger.debug("Switched!");
  cb();
};

var _getPrev = function(ms, cb) {
  //ms.PrevWS();
  //assume switch was successful
  app.logger.debug("Switched!");
  cb();
};

var _getToWS = function(wsId, ms, cb) {
  ms.GoToWS(wsId);
  //assume switch was successful
  app.logger.debug("Switched!");
  cb();
};


var _loop = function(ms, key) {
  if (loopStates[path] === true) {
    //app.logger.debug("Loop step " + path);
    let rc = ms.AdvanceState();
    if (rc === 0) {  // OK
      //app.logger.debug("OK...");
      _getDelta(ms, key, function(b) {
        app.ioServer.emit('nc:delta', JSON.parse(b));
        if (playbackSpeed > 0) {
          if (loopTimer !== undefined)
              clearTimeout(loopTimer);
          loopTimer = setTimeout(function () { _loop(ms, false); }, 50 / (playbackSpeed / 200));
        }
        else {
          // app.logger.debug("playback speed is zero, no timeout set");
        }
      });
    }
    else if (rc == 1) {   // SWITCH
      app.logger.debug("SWITCH...");
      _getNext(ms, function() {
        _loop(ms, true);
      });
    }
  }
};

var _loopInit = function(req, res) {
  // app.logger.debug("loopstate is " + req.params.loopstate);
    if (req.params.loopstate === undefined) {
      if (loopStates[path] === true) {
        res.status(200).send(JSON.stringify({'state': "play", 'speed': playbackSpeed}));
      }
      else {
        res.status(200).send(JSON.stringify({'state': "pause", 'speed': playbackSpeed}));
      }
    }
    else
    {
      let loopstate = req.params.loopstate;
      var ms = file.ms;
      if (typeof(loopStates[path]) === 'undefined') {
        loopStates[path] = false;
      }

      switch (loopstate) {
        case "start":
          if (loopStates[path] === true) {
            res.status(200).send("Already running");
            return;
          }
          app.logger.debug("Looping " + path);
          loopStates[path] = true;
          res.status(200).send("OK");
          update("play");
          _loop(ms, false);
          break;
        case "stop":
          if (loopStates[path] === false) {
            res.status(200).send("Already stopped");
            return;
          }
          loopStates[path] = false;
          update("pause");
          res.status(200).send("OK");
          break;
        default:
          if (!isNaN(parseFloat(loopstate)) && isFinite(loopstate)) {
            let newSpeed = Number(loopstate);

            if (Number(playbackSpeed) !== newSpeed) {
              playbackSpeed = newSpeed;
              app.logger.debug("Changing speed to " + newSpeed);
            }

            if (loopStates[path] === true) {
              _loop(ms, false);
              res.status(200).send(JSON.stringify({"state": "play", "speed": playbackSpeed}));
            }
            else {
              res.status(200).send(JSON.stringify({"state": "pause", "speed": playbackSpeed}));
            }
            _updateSpeed(playbackSpeed);
          }
          else {
            // untested case
          }
      }
    }
};

var _wsInit = function(req, res) {
  if (req.params.command) {
    let command = req.params.command;
    var ms = file.ms;
    if (typeof(loopStates[path]) === 'undefined') {
      loopStates[path] = false;
    }

    // load the machine tool using global options
    /*if (app.machinetool !== "")
      ms.LoadMachine(app.machinetool);*/

    switch(command) {
      case "next":
        var temp = loopStates[path];
        loopStates[path] = true;
        if (temp) {
        _getNext(ms, function() {
        _loop(ms, true);
        });
        }
        else{
          _loop(ms,false);
          _getNext(ms, function() {
          _loop(ms, true);
          });
          loopStates[path] = false;
          update("pause");
        }
        res.status(200).send("OK");
        break;
      case "prev":
        /*var temp = loopStates[path];
        loopStates[path] = true;
        if (temp) {
        _getPrev(ms, function() {
        _loop(ms, true);
        });
        loopStates[path] = false;
        update("pause");
        }
        else{
          _loop(ms,false);
          _getPrev(ms, function() {
          _loop(ms, true);
          });
          loopStates[path] = false;
          update("pause");
        }
        res.status(200).send("OK");*/
        break;
        default:
          if (!isNaN(parseFloat(command)) && isFinite(command)) {
            let ws = Number(command);
            temp = loopStates[path];
            loopStates[path] = true;
            if (temp) {
            _getToWS(ws, ms, function() {
            _loop(ms, true);
            });
            loopStates[path] = false;
            update("pause");
            }
            else{
              _loop(ms,false);
              _getToWS(ws, ms, function() {
              _loop(ms, true);
              });
              loopStates[path] = false;
              update("pause");
            }
            res.status(200).send("OK");
              }
              else {
                // untested case
              }
      }
      _getDelta(ms, false, function(b) {
        app.ioServer.emit('nc:delta', JSON.parse(b));
        if (playbackSpeed > 0) {
          if (loopTimer !== undefined)
              clearTimeout(loopTimer);
          loopTimer = setTimeout(function () { _loop(ms, false); }, 50 / (playbackSpeed / 200));
        }
        else {
          // app.logger.debug("playback speed is zero, no timeout set");
        }
      });
  }
};

var _getKeyState = function (req, res) {
    var ms = file.ms;
    if (ms === undefined) {
      res.status(404).send("Machine state could not be found");
      return;
    }
    res.status(200).send(ms.GetKeystateJSON());
};

var _getDeltaState = function (req, res) {
    var ms = file.ms;
    if (ms === undefined) {
      res.status(404).send("Machine state could not be found");
      return;
    }
    res.status(200).send(ms.GetDeltaJSON());
};

module.exports = function(globalApp, cb) {
  app = globalApp;
  app.router.get('/v3/nc/state/key', _getKeyState);
  app.router.get('/v3/nc/state/delta', _getDeltaState);
  app.router.get('/v3/nc/state/loop/:loopstate', _loopInit);
  app.router.get('/v3/nc/state/loop/', _loopInit);
  app.router.get('/v3/nc/state/ws/:command', _wsInit);
  if (cb) cb();
};
