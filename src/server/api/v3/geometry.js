'use strict';
var file = require('./file');

/***************************** Endpoint Functions *****************************/

function _getDelta(req,res){
    //TODO: Fix lower-level code and remove this garbage HACK!!!!!!!!!!!!
  let rtn = file.ms.GetDeltaGeometryJSON(Number(req.params.current));
  let rrtn = JSON.parse(rtn).geom[0];
  res.status(200).send(rrtn)
}

function _getGeometry(req, res) {
  let ms = file.ms;
  let find = file.find;
  //Route the /geometry/delta/:current endpoint first.
  if(req.params.id === 'delta') {
    req.params.current = req.params.type;
    _getDelta(req, res);
    return;
  }
  if (req.params.type === 'shell') {
    res.status(200).send(ms.GetGeometryJSON(req.params.id , 'MESH'));
    return;
  } else if (req.params.type === 'annotation') {
    res.status(200).send(ms.GetGeometryJSON(req.params.id , 'POLYLINE'));
    return;
  } else if (req.params.type === 'tool') {
    let toolId = find.GetToolWorkpiece(Number(req.params.id));
    res.status(200).send(find.GetJSONProduct(toolId)); // toolId));
    return;
  } else if (!req.params.type && req.params.eid) {
    if (!isNaN(Number(req.params.eid)) && isFinite(Number(req.params.eid))) {
      res.status(200).send(find.GetJSONProduct(Number(req.params.eid)));
    } else {
      res.status(200).send(find.GetJSONGeometry(req.params.eid, 'MESH'));
    }
    return;
  }
  res.status(200).send(ms.GetGeometryJSON());
  return;
}

function _getEIDfromUUID(req, res){
  let ms = file.ms;
  if(req.params.uuid){
    res.status(200).send(JSON.stringify(ms.GetEIDfromUUID(req.params.uuid)));
    return;
  }
}

module.exports = function(app, cb) {
  app.router.get('/v3/nc/geometry', _getGeometry);
  app.router.get('/v3/nc/geometry/:id/:type', _getGeometry);
  app.router.get('/v3/nc/geometry/:eid', _getGeometry);
  app.router.get('/v3/nc/id/:uuid', _getEIDfromUUID);
  if (cb) {
    cb();
  }
};
