'use strict';
var file = require('./file');
var fs = require('fs');
let scache = require('./statecache');
let ms ={};//statecache or file.ms depending on config.UseCache
/***************************** Endpoint Functions *****************************/

let __curdelt = {};
let _curdeltv = -1;

function _updateDelta(){
  return ms.GetDynamicGeometryVersion()
    .then((v)=> {
      if (v != -1 && v <= _curdeltv) {
        v = undefined;
        return;
      }
      v = undefined;
      return ms.GetDynamicGeometryJSON(Number(-1))
        .then((rtn)=> {
          __curdelt = JSON.parse(rtn);
          _curdeltv = __curdelt.version;
          return;
        });
    });
};
function _getDelta(req,res){
  res.status(200).send(__curdelt);
}

function _resetDelta(res){
  ms.ResetDynamicGeometry().then(res.status(200).send());
}

let geomcache = {};
function _getMesh(id,res){
  if(geomcache[id]) {
      res.status(200).send(geomcache[id]);
      return;
  }
  ms.GetGeometryJSON(id , 'MESH')
      .then((out)=>{
        geomcache[id]=out;
        res.status(200).send(out);
        out=null;
      });
}
let polycache = {};
function _getPoly(id,res){
    if(polycache[id]) {
        res.status(200).send(polycache[id]);
        return;
    }
    ms.GetGeometryJSON(id , 'POLYLINE')
      .then((out)=>{
        polycache[id] = out;
        res.status(200).send(out);
        out=null;
      });
}

function _getGeometry(req, res) {
  let find = file.find;
  //Route the /geometry/delta/:current endpoint first.
  if(req.params.id === 'delta') {
    if(req.params.type ==='reset'){
      _resetDelta(res);
    } else {
      req.params.current = req.params.type;
      _getDelta(req, res);
    }
    return;
  }
  if (req.params.type === 'shell') {
      _getMesh(req.params.id,res);
    return;
  } else if (req.params.type === 'annotation') {
    _getPoly(req.params.id,res);
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
  ms.GetGeometryJSON()
    .then((out)=>{
      res.status(200).send(out);
      out=null;
    });
  return;
}

function _getEIDfromUUID(req, res){
  if(req.params.uuid){
    file.ms.GetEIDfromUUID(req.params.uuid)
      .then((out)=>{
        res.status(200).send(out)
      });
    return;
  }
}

module.exports = function(app, cb){
  app.updateDynamic = _updateDelta;
  app.router.get('/v3/nc/geometry', _getGeometry);
  app.router.get('/v3/nc/geometry/:id/:type', _getGeometry);
  app.router.get('/v3/nc/geometry/:eid', _getGeometry);
  app.router.get('/v3/nc/id/:uuid', _getEIDfromUUID);
  if(app.config.noCache ===true){
    ms = file.ms;
  } else {
    ms = scache;
  }
  if (cb) {
    cb();
  }
};
