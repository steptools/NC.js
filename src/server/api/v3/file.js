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

function init(path, machinetool,dump) {
  fs.accessSync(path, fs.R_OK , () => process.exit());

  this.project = Path.basename(path,Path.extname(path));
  try {
    fs.accessSync(machinetool,fs.R_OK);
  } catch (e){
    machinetool='';
  }
  openSimpleNcs = openSimpleNcs.bind(this);
  openSimpleNcs(path);
  openMachineState = openMachineState.bind(this);
  openMachineState(path,machinetool);
  if(dump!==''){
    this.ms.SetDumpDir(dump);
  }
	return;
}

module.exports.init = init;
module.exports.project = this.project;
module.exports.find = this.find;
module.exports.apt = this.apt;
module.exports.tol = this.tol;
module.exports.ms = this.ms;
