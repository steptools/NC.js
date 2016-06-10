"use strict"
var StepNC = require('../../../../../StepNCNode/build/Release/StepNC');

function _getnext(pid,res) {

  var machinestate = new StepNC.machineState(pid);
  machinestate.nextWS();
}

function _getdelta(pid,key,res) {
  var machinestate = new StepNC.machineState(pid);

  if(!key){
    let rtn_delta = machinestate.GetDeltaJSON();
    //res.send(rtn_delta);
    return rtn_delta;
  }
  else{
    let rtn_key = machinestate.GetKeystateJSON();
    //res.send(rtn_key);
    return rtn_key;
  }

}

console.log(_getdelta("model.stpnc" ,true));
