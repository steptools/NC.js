"use strict";
var StepNC = require('../../../../../StepNCNode/build/Release/StepNC');

var update = (val) => {
  app.ioServer.emit("nc:state", val);
}

// true at _loopstates[ncid] if the loop is playing
var loopstates = {};

var _loop = function(pid, key) {
  if (_loopstates[pid] === true) {
    //app.logger.debug("Loop step " + pid);
    let rc = machineState.StepState();
  }
}



// loopstate = state, start, or stop
var _loopInit = function(ncId, loopstate) {
  var machineState = new StepNC.machineState("model.stpnc");
  switch(loopstate) {
    case "state":
      if (_loopstates[ncId] === true) {
        console.log("play");
      }
      else {
        console.log("pause");
      }
      break;
    case "start":
      if (_loopstates[ncId] === true) {
        console.log("Already running");
        return;
      }
      //app.logger.debug("Looping " + ncId);
      _loopstates[ncId] = true;
      console.log("OK");
      //_update("play");
      _looper(ncId, false);
      break;
    case "stop":
      if (_loopstates[ncId] === false) {
        console.log("Already stopped");
        return;
      }
      _loopstates[ncId] = false;
      _update("pause");
      console.log("OK");
      break;
  }
}

console.log(_loopInit("model.stpnc", "start"));
