"use strict";
let StepNC = require('../../../../../STEPNode/build/Release/StepNC');
let fs = require("fs");

let path;
let find;
let apt;
let tol;
let ms;

function init(path, machinetool){
	fs.accessSync(path, fs.R_OK , (err) => {
  		process.exit();
	});
	this.apt = new StepNC.AptStepMaker();
	this.find = new StepNC.Finder();
	this.tol = new StepNC.Tolerance();
	this.ms = new StepNC.machineState(path);
	if(machinetool !== ""){
		if(!this.ms.LoadMachine(machinetool))
			console.log("ERROR: Machinetool was not loaded");
		else
			console.log("Loaded Machine Successfully")
	}
	this.apt.OpenProject(path);
	this.find.OpenProject(path);
	return;
}

module.exports.init = init;
module.exports.find = find;
module.exports.apt = apt;
module.exports.tol = tol;
module.exports.ms = ms;