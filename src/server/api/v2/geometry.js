"use strict";
var StepNC = require('../../../../../StepNCNode/build/Release/StepNC');
var file = require('./file');
var app;


function _getGeometry(req , res){
  if (req.params.ncId) {
    let ncId = req.params.ncId;
    var ms = file.getMachineState(ncId);
  }
  if(req.params.ncId && req.params.type === "shell"){
    res.status(200).send(ms.GetGeometryJSON(req.params.shellId , "MESH"));

  }
  else if(req.params.ncId && req.params.type === "annotation"){
    res.status(200).send(ms.GetGeometryJSON(req.params.annoId , "POLYLINE"));

  }
  else if(req.params.ncId){
     let ret = '';
     ret = ms.GetGeometryJSON();
     console.log(ret);
     res.status(200).send(ret);
  }
}
module.exports = function(app, cb) {
  app.router.get("/v2/nc/projects/:ncId/geometry", _getGeometry);
  app.router.get("/v2/nc/projects/:ncId/geometry/:uuid/:type", _getGeometry);
  if (cb) cb();
};
