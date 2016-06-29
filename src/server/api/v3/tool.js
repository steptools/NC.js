"use strict";
var StepNC = require('../../../../../STEPNode/build/Release/StepNC');
var file = require('./file');
var find = file.find;

var _getTools = function (req, res) {
    let toolList = find.GetToolAll();
    let rtn = []
    for(let id of toolList){
        let name = find.GetToolPartName(id);
        rtn.push({"id" : id, "name": name})
    }
    res.status(200).send(rtn);
};

var _getWsTool = function (req, res) {
  if (req.params.wsId) {
    let wsId = req.params.wsId;
    let rtn = find.GetWorkingstepTool(Number(wsId));
    res.status(200).send(String(rtn));
  }
};

module.exports = function(app, cb) {
  app.router.get("/v3/nc/tools", _getTools);
  app.router.get("/v3/nc/tools/:wsId", _getWsTool);
  if (cb) cb();
};
