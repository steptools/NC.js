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

'use strict';
let StepNC = require('STEPNode');
let fs = require('fs');
let _ = require('lodash');
let Path = require('path');

let project = '';

function openSimpleNcs(path){
  this.apt = new StepNC.AptStepMaker();
  this.find = new StepNC.Finder();

  this.apt.OpenProject(path);
  this.find.OpenProject(path);

  this.tol = new StepNC.Tolerance(); //tol keys off of apt.
}
function openMachineState(path,tool){
  this.ms = new StepNC.machineState(path,true,tool);
  return;
}

function init(path, machinetool,dump,is242) {
  fs.accessSync(path, fs.R_OK , () => process.exit());

  this.project = Path.basename(path,Path.extname(path));
  openSimpleNcs = openSimpleNcs.bind(this);
  openSimpleNcs(path);
  if (!is242) {
    try {
      fs.accessSync(machinetool, fs.R_OK);
    } catch (e) {
      machinetool = '';
    }
    openMachineState = openMachineState.bind(this);
    openMachineState(path, machinetool);
    if (dump !== '') {
      this.ms.SetDumpDir(dump);
    }
  }
	return;
}

module.exports.init = init;
module.exports.project = this.project;
module.exports.find = this.find;
module.exports.apt = this.apt;
module.exports.tol = this.tol;
module.exports.ms = this.ms;
