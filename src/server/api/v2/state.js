"use strict";
var StepNC = require('../../../../../StepNCNode/build/Release/StepNC');
var machinestate = new StepNC.machineState("model.stpnc");

function _getnext(pid,res) {

  machinestate.LoadMachine(pid);
  var n_ws = machinestate.nextWS();
  res.send(n_ws);
}

function _getdelta(pid,key,res) {
  machinestate.LoadMachine(pid);
  if(!key){
    var rtn_delta = machinestate.GetDeltaJSON();
    res.send(rtn_delta);
  }
  else{
    var rtn_key = machinestate.GetKeystateJSON();
    res.send(rtn_key);
  }

}

console.log(_getdelta(94989 ,false));
