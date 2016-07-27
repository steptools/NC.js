'use strict';
var file = require('./file');
var _ = require('lodash');
var tol = file.tol;
var apt = file.apt;
var find = file.find;

/****************************** Helper Functions ******************************/

function getTolerance(id) {
  let name = apt.SetNameGet(id);
  let tolTypeName = tol.GetToleranceType(id);
  let tolType;
  if (tolTypeName) {
    tolTypeName = tolTypeName.replace(/_/g, ' ').toLowerCase();
    tolType = tolTypeName.split(' ')[0];
  }

  return {
    'id': id,
    'type': 'tolerance',
    'name': name,
    'tolTypeName': tolTypeName,
    'toleranceType': tolType,
    'value': tol.GetToleranceValue(id),
    'unit' : tol.GetToleranceUnit(id),
    'faces': tol.GetToleranceFaceAll(id),
  };
}

function getWp(id, type) {
  let name = find.GetWorkpieceName(id);
  let steps = apt.GetWorkpieceExecutableAll(id);
  let tolerances = tol.GetWorkpieceToleranceAll(id);
  let ret = {
    'id': id,
    'name': name,
    'workingsteps': steps,
    'wpType': type,
    'tolerances': tolerances,
    'children': [],
    'subs': [],
  };
  if (type) {
    ret.type = 'workpiece';
  }

  let asmList = find.GetWorkpieceSubAssemblyAll(id);

  for (let subId of asmList) {
    if (id !== subId) {
      let sub = getWp(subId);
      ret.subs.push(sub);
      ret.subs.concat(sub.subs);
    }
  }

  return ret;
}

function getWsTols(wsId, wpId) {
  if (find.IsWorkingstep(wsId)) { // this may be able to be factored out later
    let tolerances = JSON.stringify(tol.GetWorkingstepToleranceAll(wsId));
    return tolerances;
  } else {  // we are looking for a tolerance
    let tol = getTolerance(Number(wsId));
    tol.workpiece = wpId;
    return tol;
  }
}

/***************************** Endpoint Functions *****************************/

function _getWsTols(req, res) {
  if (req.params.wsId) {
    let wsId = req.params.wsId;
    if (find.IsWorkingstep(wsId)) { // this may be able to be factored out later
      let tolerances = JSON.stringify(tol.GetWorkingstepToleranceAll(wsId));
      res.status(200).send(tolerances);
    } else {  // we are looking for a tolerance
      let tol = getTolerance(Number(req.params.wsId));
      res.status(200).send(tol);
    }
  }
}

function _getTols(req, res) {
  let tolList = tol.GetToleranceAll();
  let ret = [];
  for (let id of tolList) {
    ret.push(getTolerance(id));
  }
  res.status(200).send(ret);
}

function _getWps(req, res) {
  let wps = find.GetWorkpieceAll();
  let ret = {};
  for (let id of wps) {
    let type = find.GetWorkpieceType(id);
    let wp = getWp(id, type);

    if (wp.wpType === 'workpiece') {
      ret[wp.id] = wp;
      _.each(wp.subs, (child) => {
        wp.tolerances = wp.tolerances.concat(child.tolerances);
      });
      wp.subs = undefined;
    }

    _.each(wp.tolerances, (wpTol) => wp.children.push(getWsTols(wpTol, wp.id)));
    wp.tolerances = undefined;
  }

  res.status(200).send(ret);
}

module.exports = function(app, cb) {
  app.router.get('/v3/nc/tolerances/:wsId', _getWsTols);
  app.router.get('/v3/nc/tolerances/', _getTols);
  app.router.get('/v3/nc/workpieces/', _getWps);

  if (cb) {
    cb();
  }
};
