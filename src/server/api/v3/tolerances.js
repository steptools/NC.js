"use strict";
var StepNC = require('../../../../../STEPNode/build/Release/StepNC');
var file = require('./file');
var _ = require('lodash');
var tol = file.tol;
var apt = file.apt;
var find = file.find;

var _getWorkstepsForTolerance = function(exe, tolId) {
    if (find.IsWorkingstep(exe)) {
        let allTols = tol.GetWorkingstepToleranceAll(exe);
        if (_.indexOf(allTols, tolId) !== -1) {
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
                rtn = rtn.concat(_getWorkstepsForTolerance(childId, tolId));
            });
        }
        return rtn;
    }
    else {
        console.log("something's afoot");
        return [];
    }
};


var _getTols = function(req,res) {
  let tol_list = tol.GetToleranceAll();
  let ret = [];
  for (let id of tol_list){
      let steps = _getWorkstepsForTolerance(find.GetMainWorkplan(), id);
      let name = tol.GetToleranceType(id).replace(/_/g, ' ').toLowerCase();
      let tolType = name.split(' ')[0];
      
      ret.push({
          "id":id,
          "type": 'tolerance',
          "name": name,
          "toleranceType": tolType,
          "value": tol.GetToleranceValue(id),
          "workingsteps": steps,
          "unit" : tol.GetToleranceUnit(id)
      });
  }
  res.status(200).send(ret);
};

var _getWsTols = function(req,res) {
  if (req.params.wsId){
    let wsId = req.params.wsId;
    let tolerances = JSON.stringify(tol.GetWorkingstepToleranceAll(wsId));
    console.log("tolerances" + tolerances);
    res.status(200).send(tolerances);
  }
};

module.exports = function(app, cb) {
  app.router.get('/v3/nc/tolerances/:wsId',_getWsTols);
  app.router.get('/v3/nc/tolerances/',_getTols);

  if (cb) cb();
};