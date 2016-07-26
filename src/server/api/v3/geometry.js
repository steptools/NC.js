"use strict";
var StepNC = require('../../../../../STEPNode/build/Release/StepNode');
var file = require('./file');

///*******************************************************************\
//|                                                                    |
//|                       Helper Functions                             |
//|                                                                    |
//\*******************************************************************/



///*******************************************************************\
//|                                                                    |
//|                       Endpoint Functions                           |
//|                                                                    |
//\*******************************************************************/

let _getGeometry = function(req , res){
  let ms = file.ms;
  let find = file.find;

  if(req.params.type === "shell"){
    res.status(200).send(ms.GetGeometryJSON(req.params.uuid , "MESH"));
    return;
  }
  else if(req.params.type === "annotation"){
    res.status(200).send(ms.GetGeometryJSON(req.params.uuid , "POLYLINE"));
    return;
  }
  else if (req.params.type === 'tool') {
    let toolId = Number(req.params.eid); // find.??(Number(req.params.eid));
    res.status(200).send(find.GetGeometryJSON(toolId));
    return;
  }
  else if (!req.params.type && req.params.eid) {
    res.status(200).send(find.GetGeometryJSON(Number(req.params.eid)));
    return;
  }
  res.status(200).send(ms.GetGeometryJSON());
  return;
}

module.exports = function(app, cb) {
  app.router.get("/v3/nc/geometry", _getGeometry);
  app.router.get("/v3/nc/geometry/:uuid/:type", _getGeometry);
  app.router.get("/v3/nc/geometry/:eid", _getGeometry);
  if (cb) cb();
};
