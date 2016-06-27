"use strict";
var StepNC = require('../../../../../NC.js/build/Release/StepNC');
var file = require('./file');
var find = file.find;

var _getTools = function (req, res) {
  if (req.params.ncId) {
    let ncId = req.params.ncId;
    find.OpenProject(file.getPath(ncId));
    let toolList = find.GetToolAll();
    let rtn = []
    for(let id of toolList){
        let type = find.GetToolType(id) + " - " + find.GetToolIdentifier(id);
        rtn.push({"id" : id, "type" : type})
    }
    res.status(200).send(rtn);
  }
};

var _getSpecTool = function (req, res) {
  if (req.params.ncId && req.params.toolId) {
  	let ncId = req.params.ncId;
  	let toolId = req.params.toolId;
    
    res.status(200).send();
  }
};

module.exports = function(app, cb) {
  app.router.get("/v2/nc/projects/:ncId/tools", _getTools);
  app.router.get("/v2/nc/projects/:ncId/tools/:toolId", _getSpecTool);
  if (cb) cb();
};
