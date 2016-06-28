"use strict";
var StepNC = require('../../../../../STEPNode/build/Release/StepNC');
var file = require('./file');
var tol = file.tol;
var apt = file.apt;
var find = file.find;



var _getTols = function(req,res) {
  if (req.params.ncId) {
    let ncId = req.params.ncId;
    apt.OpenProject(file.getPath(ncId));
    let tol_list = tol.GetToleranceAll();
    let ret = [];
    for (let id of tol_list){
      ret.push({"id":id,"type":tol.GetToleranceType(id),"value":tol.GetToleranceValue(id)});
    }
    res.status(200).send(ret);
  }
};

var _getWsTols = function(req,res) {
  if (req.params.ncId && req.params.wsId){
    let ncId = req.params.ncId;
    let wsId = req.params.wsId;
    apt.OpenProject(file.getPath(ncId));
    res.status(200).send(tol.GetWorkingstepToleranceAll(wsId));
  }
}


module.exports = function(app, cb) {
  //This route gets all toleranceId's associated with a given workingstep
  app.router.get('/v2/nc/projects/:ncId/tolerances/:wsId',_getWsTols);
  //This route returns a JSON object with all Tolerances (ID-{type,value})
  app.router.get('/v2/nc/projects/:ncId/tolerances',_getTols);
  if (cb) cb();
};