/* 
 * Copyright (c) 2016-2017 by STEP Tools Inc. 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */

// TODO: styleguide compliance
'use strict';
var file = require('./file');
var find = file.find;
var _ = require('lodash');

/****************************** Helper Functions ******************************/

function exeFromId(id) {
  let ws = {
    'id': id,
    'name': find.GetExecutableName(id),
    'baseTime': find.GetExecutableBaseTime(id),
    'timeUnits': find.GetExecutableTimeUnit(id),
    'distance': find.GetExecutableDistance(id),
    'distanceUnits': find.GetExecutableDistanceUnit(id),
    'setupID': getSetupFromId(id),
    'asIs': {
      id: find.GetExecutableWorkpieceAsIsLocal(id),
      inherited: false,
    },
    'toBe': {
      id: find.GetExecutableWorkpieceToBeLocal(id),
      inherited: false,
    },
    'delta': {
      id: find.GetExecutableWorkpieceRemovalLocal(id),
      inherited: false,
    },
  };

  if (ws.asIs.id === 0) {
    ws.asIs.id = find.GetExecutableWorkpieceAsIs(id);
    ws.asIs.inherited = true;
    if (ws.asIs.id === 0) {
      ws.asIs = null;
    }
  }

  if (ws.toBe.id === 0) {
    ws.toBe.id = find.GetExecutableWorkpieceToBe(id);
    ws.toBe.inherited = true;
    if (ws.asIs.id === 0) {
      ws.asIs = null;
    }
  }

  if (ws.delta.id === 0) {
    ws.delta.id = find.GetExecutableWorkpieceRemoval(id);
    ws.delta.inherited = true;
    if (ws.delta.id === 0) {
      ws.delta = null;
    }
  }

  let childPromises = [];
  if (find.IsWorkplan(id)||find.IsSelective(id)) {
    let children = find.GetNestedExecutableAll(id);
    if (children !== undefined) {
      ws.children = [];
      for(let i=0;i<children.length;i++){
        childPromises.push(
          exeFromId(children[i]).then((r)=>{
            ws.children[i]=r;
          })
        );
      }
    }
  }
  return Promise.all(childPromises)
    .then(() => {
      if (find.IsEnabled(id)) {
        ws.enabled = true;
      } else {
        ws.enabled = false;
        propagateDisabled(ws);
      }

      if (find.IsWorkingstep(id)) {
        ws.type = 'workingstep';
        ws.tool = find.GetWorkingstepTool(id);
        ws.feedRate = find.GetProcessFeed(id);
        ws.feedUnits = find.GetProcessFeedUnit(id);
        ws.speed = find.GetProcessSpeed(id);
        ws.speedUnits = find.GetProcessSpeedUnit(id);
        let tolerances = file.tol.GetWorkingstepToleranceAll(id);
        if (tolerances.length > 0) {
          ws.tolerances = tolerances;
        }
        return file.ms.GetWSColor(id)
          .then((c) => {
            ws.color = c;
            return ws;
          });
      } else if (find.IsSelective(id)) {
        ws.type = 'selective';
      } else if (find.IsWorkplanWithSetup(id)) {
        ws.type = 'workplan-setup';
      } else if (find.IsWorkplan(id)) {
        ws.type = 'workplan';
      } else if (find.IsNcFunction(id)) {
        ws.type = 'Nc Function';
        let type = find.GetExecutableType(id);
        switch(type){
          case "DISPLAY_MESSAGE":
          ws.name = find.GetFunctionDisplayMessage(id); 
            break;
          case "EXTENDED_NC_FUNCTION":
            ws.name = find.GetFunctionExtendedNcDescription(id);
            break;
          default:
            ws.name = type;
        }
      }

      return Promise.resolve(ws);
});
}

function propagateDisabled(ws) {
  if (ws.children) {
    _.each(ws.children, (child) => {
      child.enabled = ws.enabled;
      propagateDisabled(child);
    });
  }
}


function getSetupFromId(id) {
  let currentid = parseInt(id);
  while (currentid !== 0 && !find.IsWorkplanWithSetup(currentid)) {
    currentid = find.GetExecutableContainer(currentid);
  }
  return currentid;
}



function _putExeFields(req, res) {
  // put should return some updated code
  res.status(200).send();
}



/***************************** Endpoint Functions *****************************/

function _getExeFromId(req, res) {
  if (req.params.wsId !== undefined) {
    let wsId = req.params.wsId;
    let newId = parseInt(wsId);
    let exe = exeFromId(newId);
    if (exe !== undefined) {
      exe.then((r)=>{
      res.status(200).send(r);
      });
    } else {
      res.status(404).send('Executable not found');
    }
  } else {
    res.status(404).send('No workstep ID provided');
  }
}

function _getMwp(req, res) {
  let mwpId = find.GetMainWorkplan();
  exeFromId(mwpId).then((r)=>{
    res.status(200).send(r);
  });
}

function _getSetup(req, res) {
  if (req.params.wsId !== undefined) {
    let wsId = req.params.wsId;
    let newId = getSetupFromId(parseInt(wsId));
    res.status(200).send(String(newId));
  }
}
function _getProject(req,res){
  res.status(200).send(find.GetProjectName());
}


module.exports = function(app, cb) {
  app.router.get('/v3/nc/workplan/:wsId', _getExeFromId);
  app.router.get('/v3/nc/workplan', _getMwp);
  app.router.put('/v3/nc/workplan', _putExeFields);
  app.router.get('/v3/nc/setup/:wsId', _getSetup);
  app.router.get('/v3/nc/project',_getProject);
  if (cb) {
    cb();
  }
};

module.exports.getSetupFromId = getSetupFromId;
