/* 
 * Copyright (c) 1991-2017 by STEP Tools Inc. 
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
 * Author: David Loffredo (loffredo@steptools.com)
 */

'use strict';
var file = require('./file');
let StepNC = require('STEPNode');
var app;
var cfg = {};


function _findConfig() {
  let ctl = new StepNC.Adaptive();

  // Add the elements of all selectives to dictionary by name.
  ctl.SetVisitAllExecs(true);
  ctl.SetWantedAll(false);
  ctl.SetWanted(StepNC.CtlEvent.EXEC_SELECT_NEXT);
  ctl.StartProject();

  let execs = {};
  while (ctl.Next()) {
    let id = ctl.GetActiveExec();
    let nm = file.find.GetExecutableName(id);

    if (execs[nm] === undefined) {
      execs[nm] = [];
    }
    execs[nm].push({'id': id, 'active': file.find.IsEnabled(id) });
  }

  let ret = {
    "configs": Object.keys(execs).sort()
  };
  // look for configs that have some enabled WSs enabled and ones that
  // have everything enabled.  Selected if both lists have one entry.
  
  let partial = ret.configs.filter(
    nm => execs[nm].find(elem => elem.active)
  ).sort();

  let selected = partial.filter(
    nm => execs[nm].every(elem => elem.active)
  );

  if ((partial.length === 1) && (selected.length === 1)) {
    ret.selected = selected[0];
  } else if (partial.length > 0) {
    ret.partial = partial;
  }
  return ret;
}


function _setConfig(nm) {
  let ctl = new StepNC.Adaptive();

  // Adjust enabled flag on elements of all selectives
  ctl.SetVisitAllExecs(true);
  ctl.SetWantedAll(false);
  ctl.SetWanted(StepNC.CtlEvent.EXEC_SELECT_NEXT);
  ctl.StartProject();

  while (ctl.Next()) {
    let id = ctl.GetActiveExec();
    let active = (nm === file.find.GetExecutableName(id));
    if (active !== file.find.IsEnabled(id)) {
      if (active) {
	file.apt.SetCNCexportExecEnabled(id);
      } else {
	file.apt.SetCNCexportExecDisabled(id);
      }
    }
  }
  // Compute a fresh config structure after changing values
  return _findConfig();
}




function _getConfig(req,res) {
  // find existing config 
  if (cfg.configs === undefined) {
    cfg = _findConfig();
  }
  
  if ((req.params.name !== undefined) &&
      (cfg.configs.includes(req.params.name))) {
    // change config, send new, issue event
    cfg = _setConfig(req.params.name);
    res.status(200).send(cfg);
    app.ioServer.emit('custom:config', cfg);
  } else {
    // send existing config
    res.status(200).send(cfg);
  }
}

module.exports = function(globalApp, cb) {
  app = globalApp;

/*****
  // CUSTOM-APP - Register API endpoints
  app.router.get('/v3/custom/config', _getConfig);
  app.router.get('/v3/custom/config/:name', _getConfig);
*****/
  
  if (cb) {
    cb();
  }
};

