"use strict";
var StepNC = require('../../../../../STEPNode/build/Release/StepNC');
var file = require('./file');
var find = file.find;
var request = require("superagent");
var parseXMLString = require("xml2js");
var _ = require("lodash");
var fs = require("fs");

var app;
var loopTimer;
var loopStates = {};
let playbackSpeed = 100;
let path = find.GetProjectName();

var WSGCodeIndex = 0;
var WSGCode = [];

var update = (val) => {
  app.ioServer.emit("nc:state", val);
};

var _updateSpeed = (speed) => {
  app.ioServer.emit("nc:speed", speed);
};

var MTListen = function() {
  var resCoords = [];
  var sequence = "";
  var xOffset;
  var yOffset;
  var zOffset;
  var currentgcode;
  console.log(find.GetProjectName());

  return new Promise(function(resolve, reject) {
    let mtc = request.get("http://192.168.0.123:5000/current");
    mtc.end(function (err, res) {
      parseXMLString.parseString(res.text, function (error, result) {


        let pathtag = _.find(result["MTConnectStreams"]["Streams"][0]["DeviceStream"][0]["ComponentStream"], function(tag) {
          if (tag["$"]["name"] === "path") {
            return true;
          }
          else {
            return false;
          }
        });
        resCoords = pathtag.Samples[0].PathPosition[0]._.split(" ");


        if (pathtag["Events"][0]["Block"]) {
          currentgcode = pathtag["Events"][0]["Block"][0]["_"];
        }
        else {
          currentgcode = pathtag["Events"][0]["e:BlockNumber"][0]["_"];
        }

        let xTag = _.find(pathtag["Events"][0]["e:Variables"], function(tag) {
          if (tag["$"]["subType"] === "x:WORKOFFSET_X_AXIS") {
            return true;
          }
          else {
            return false;
          }
        });
        xOffset = parseInt(xTag["_"]);

        let yTag = _.find(pathtag["Events"][0]["e:Variables"], function(tag) {
          if (tag["$"]["subType"] === "x:WORKOFFSET_X_AXIS") {
            return true;
          }
          else {
            return false;
          }
        });

        yOffset = parseInt(yTag["_"]);

        let zTag = _.find(pathtag["Events"][0]["e:Variables"], function(tag) {
          if (tag["$"]["subType"] === "x:WORKOFFSET_X_AXIS") {
            return true;
          }
          else {
            return false;
          }
        });
        zOffset = parseInt(zTag["_"]);

        currentgcode = pathtag["Events"][0]["e:BlockNumber"][0]["_"];
      });


      var coords = [];
      coords[0] = parseInt(resCoords[0]);
      coords[1] = parseInt(resCoords[1]);
      coords[2] = parseInt(resCoords[2]);

      console.log(currentgcode);
      resolve([coords, xOffset, yOffset, zOffset, currentgcode]);
    });
  });
}

var findWS = function(current) {
  var change = false;

  if (current >= WSGCode["worksteps"][WSGCodeIndex]) {
    if (WSGCodeIndex >= WSGCode["worksteps"].length) {
      WSGCodeIndex = 0;
    }
    else {
      WSGCodeIndex = WSGCodeIndex + 1;
    }
    console.log("GCODE Switched!");
    return true;
  }
  while (current < WSGCode["worksteps"][WSGCodeIndex - 1]){
    if (WSGCodeIndex >= WSGCode["worksteps"].length) {
      WSGCodeIndex = 0;
    }
    else {
      WSGCodeIndex = WSGCodeIndex + 1;
    }
    change = true;
  }
  return change;
}

//TODO: Get rid of this function and consolidate with endpoint functions if possible
var _getDelta = function(ms, key, wsgcode, cb) {
  let holder = "";


  let theQuestion = MTListen();

  theQuestion.then(function(res) {
    //console.log(findWS(res[4], wsgcode));
    if (findWS(res[4], wsgcode) ) {
      console.log("keystate");
      ms.NextWS();
      holder = JSON.parse(ms.GetKeystateJSON());
      holder.next = true;
    }
    else {
      console.log("delta");
      holder = JSON.parse(ms.GetDeltaJSON());
      holder.next = false;
    }
    holder.mtcoords = res[0];
    holder.offset = [res[1], res[2], res[3]];
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
  ms.PrevWS();
  //assume switch was successful
  app.logger.debug("Switched!");
  cb();
};

var _getToWS = function(wsId, ms, cb) {
  ms.GoToWS(wsId);
  //assume switch was successful
  app.logger.debug("Switched! " + wsId);
  cb();
};

//Machine state, key, workingstep g-code
var _loop = function(ms, key, wsgcode) {
  if (loopStates[path] === true) {
    app.logger.debug("Loop step " + path);
    let rc = ms.AdvanceState();
    //if (rc === 0) {  // OK
      //app.logger.debug("OK...");
      _getDelta(ms, key, wsgcode, function(b) {
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
    /*}
    else if (rc == 1) {   // SWITCH
      app.logger.debug("SWITCH...");
      _getNext(ms, function() {
        _loop(ms, true);
      });
    }*/
  }
};

var parseGCodes = function() {
  let GCodeFile = app.project.substring(0, app.project.length - 5) + "min";
	let MTCfile = app.project.substring(0, app.project.length - 5) + "mtc";
	let lineNumber = 0;

	let fileRead = new Promise(function(resolve, reject) {
		var MTCcontent = [];
  	fs.readFile(GCodeFile, function(err, data) {
			var GCodes = data.toString().split("\n");
			_.each(GCodes, function(line) {
				if (line[0] == "(") {
					console.log("Comment");
					if (line[1] == "W") {
						console.log(lineNumber);
						MTCcontent.push(lineNumber);
					}
				}
				else {
					lineNumber++;
				}
			});
			resolve(MTCcontent);
		});
	});
	
	fileRead.then(function(res) {
		console.log(res);
	
		var JSONContent = "{\"worksteps\" : [\n";
		_.each(res, function(code){
			JSONContent = JSONContent + code.toString() + ",\n";
		});
		JSONContent = JSONContent.substring(0, JSONContent.length - 2)  + "\n]}";
	
		fs.writeFile(MTCfile, JSONContent, (err) => {console.log(err)} );
		console.log(JSONContent);
	});

	
}


var _loopInit = function(req, res) {
  // app.logger.debug("loopstate is " + req.params.loopstate);


  let MTCfile = app.project.substring(0, app.project.length - 5) + "mtc";


  fs.readFile(MTCfile, function(err, data) {
		if (err) {
				WSGCode = parseGCodes();
		}
		else {
				WSGCode = JSON.parse(data.toString());
		}
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
          _loop(ms, false, JSON.parse(data.toString()));
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
              _loop(ms, false, JSON.parse(data.toString()));
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
  });

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
        var temp = loopStates[path];
        loopStates[path] = true;
        if (temp) {
        _getPrev(ms, function() {
        _loop(ms, true);
        });
        }
        else{
          _loop(ms,false);
          _getPrev(ms, function() {
          _loop(ms, true);
          });
          loopStates[path] = false;
          update("pause");
        }
        res.status(200).send("OK");
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
