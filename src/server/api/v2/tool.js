"use strict";
var StepNC = require('../../../../../STEPNode/build/Release/StepNC');
var file = require('./file');
var _ = require('lodash');
var find = file.find;

var _getWorkstepsForTool = function(exe, toolId) {
    if (find.IsWorkingstep(exe)) {
        if (find.GetWorkingstepTool(exe) === toolId) {
            return [exe];
        }
        else {
            return [];
        }
    }
    else if (find.IsWorkplan(exe) || find.IsSelective(exe)) {
        let rtn = [];
        let children = find.GetNestedExecutableAll(exe);
        if (children !== undefined) {
            _.each(children, (childId) => {
                rtn = rtn.concat(_getWorkstepsForTool(childId, toolId));
            });
        }
        return rtn;
    }
    else {
        return [];
    }
}

var _getTools = function (req, res) {
  if (req.params.ncId) {
    let ncId = req.params.ncId;
    find.OpenProject(file.getPath(ncId));
    let toolList = find.GetToolAll();
    let rtn = [];
    for(let id of toolList){
        let name = find.GetToolPartName(id).replace(/_/g, ' ');
        let toolType = find.GetToolType(id);

        let workingsteps = _getWorkstepsForTool(find.GetMainWorkplan(), id);

        rtn.push({"id" : id, "name": name, "type": 'tool', 'toolType': toolType, "workingsteps": workingsteps});
    }
    res.status(200).send(rtn);
  }
};

/*var _getSpecTool = function (req, res) {
  if (req.params.ncId && req.params.toolId) {
  	let ncId = req.params.ncId;
  	let toolId = req.params.toolId;

    res.status(200).send();
  }
};*/

var _getWsTool = function (req, res) {
  if (req.params.ncId && req.params.wsId) {
    let ncId = req.params.ncId;
    let wsId = req.params.wsId;
    find.OpenProject(file.getPath(ncId));
    let rtn = find.GetWorkingstepTool(Number(wsId));
    res.status(200).send(String(rtn));
  }
};

module.exports = function(app, cb) {
  app.router.get("/v2/nc/projects/:ncId/tools", _getTools);
  //app.router.get("/v2/nc/projects/:ncId/tools/:toolId", _getSpecTool);
  app.router.get("/v2/nc/projects/:ncId/tools/:wsId", _getWsTool);
  if (cb) cb();
};
