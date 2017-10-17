'use strict';
var file = require('./file');
var fs = require('fs');
let scache = require('./statecache');
let ms ={};//statecache or file.ms depending on config.UseCache
let app;
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
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(__curdelt);
}

function _resetDelta(req,res){
  ms.ResetDynamicGeometry().then(()=>{
    _curdeltv = -1;
    return _updateDelta();
  }).then(() =>{
    res.status(200).send();
    app.events.emit('deltaReset');
  });
}

function _getUUIDGeometry(req, res) {
  //Route the /geometry/delta/:current endpoint first.
  ms.GetGeometryJSON(req.params.uuid)
  .then((out)=>{
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(out);
  }).catch(()=>{
    res.status(404).send();
  })
} 
function _getToolGeometry(req, res) {
  let toolId = file.find.GetToolWorkpiece(Number(req.params.id));
  res.status(200).send(file.find.GetJSONProduct(toolId)); // toolId));
  return;
}
function _getProductGeometry(req, res){
    res.status(200).send(file.find.GetJSONGeometry(req.params.uuid));
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

module.exports = function(globalApp, cb){
  app = globalApp;
  app.updateDynamic = _updateDelta;
  app.router.get('/v3/nc/geometry/tool/:id', _getToolGeometry);
  app.router.get('/v3/nc/geometry/product/:uuid', _getProductGeometry);
  app.router.get('/v3/nc/geometry/:uuid', _getUUIDGeometry);
  app.router.get('/v3/nc/geometry/delta/reset', _resetDelta);
  app.router.get('/v3/nc/geometry/delta/:version', _getDelta);
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
