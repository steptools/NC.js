"use strict";
var StepNC = require('../../../../../STEPNode/build/Release/StepNC');
var file = require('./file');
var tol = file.tol;
var apt = file.apt;
var find = file.find;



var _getTols = function(req,res) {
    let tol_list = tol.GetToleranceAll();
    let ret = [];
    for (let id of tol_list){
      ret.push({"id":id,"type":tol.GetToleranceType(id),"value":tol.GetToleranceValue(id)});
    }
    res.status(200).send(ret);
};

var _getWsTols = function(req,res) {
  if (req.params.wsId){
    let wsId = req.params.wsId;
    res.status(200).send(tol.GetWorkingstepToleranceAll(wsId));
  }
};


module.exports = function(app, cb) {
  app.router.get('/v3/nc/tolerances/:wsId',_getWsTols);
  app.router.get('/v3/nc/tolerances/',_getTols);
  if (cb) cb();
};