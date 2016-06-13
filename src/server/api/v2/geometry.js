"use strict";
var StepNC = require('../../../../../StepNCNode/build/Release/StepNC');
var machineStates = {};
var app;

var update = (val) => {
  app.ioServer.emit("nc:state", val);
};

var _getGeometry = function(req , res){
  if (req.params.ncId) {
    let ncId = req.params.ncId;
    if (typeof(machineStates[ncId]) === 'undefined') {
      machineStates[ncId] = new StepNC.machineState(ncId);
    }
  }

  if(req.params.ncId && req.params.shellId){
    res.send(machineStates[req.params.ncId].GetGeometryJSON(req.params.shellId , "MESH"));

  }
  else if(req.params.ncId && req.params.annoId){
    res.send(machineStates[req.params.ncId].GetGeometryJSON(req.params.annoId , "POLYLINE"));

  }
  else if(req.params.ncId){
     var ret = "";
     ret = machineStates[req.params.ncId].GetGeometryJSON();
     console.log(ret);
     res.status(200).send(ret);
  }
}
module.exports = function(globalApp, cb) {
  app = globalApp;
  app.router.get("/v2/nc/projects/:ncId/geometry", _getGeometry);
  app.router.get("/v2/nc/projects/:ncId/geometry/:type/:shellId", _getGeometry);
  app.router.get("/v2/nc/projects/:ncId/geometry/:type/:annoId", _getGeometry);
  if (cb) cb();
};

