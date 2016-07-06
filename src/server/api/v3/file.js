"use strict";
let StepNC = require('../../../../../STEPNode/build/Release/StepNC');
let fs = require("fs");
//Query for a json file that maps all projects in the data directory
//to a particular path in the data folder

let path;
let find;
let apt;
let tol;
let ms;

function init(path, machinetool){
	this.find = new StepNC.Finder();
	this.apt = new StepNC.AptStepMaker();
	this.tol = new StepNC.Tolerance();
	this.ms = new StepNC.machineState(path);
	if(!this.ms)
		process.exit();
	if(machinetool !== ""){
		if(!this.ms.LoadMachine(machinetool))
			console.log("ERROR: Machinetool was not loaded");
		else
			console.log("Loaded Machine Successfully")
	}
	if(!this.find.OpenProject(path))
		process.exit();
	if(!this.apt.OpenProject(path))
		process.exit();
	return;
}

module.exports.init = init;
module.exports.find = find;
module.exports.apt = apt;
module.exports.tol = tol;
module.exports.ms = ms;