"use strict";
var StepNC = require('../../../../../StepNCNode/build/Release/StepNC');
var fs = require("fs");
//Query for a json file that maps all projects in the data directory
//to a particular path in the data folder

var machineStates = {};
module.exports.getMachineState = function (ncId) {
	var ncPath = module.exports.getPath(ncId)
	if (typeof(machineStates[ncId] === 'undefined')) {
		machineStates[ncId] = new StepNC.machineState(ncPath);
		
	}
	return machineStates[ncId];
}

module.exports.getPath = function (ncId){
	let content = fs.readFileSync("data/pathmap.json");
	let jsoncontent = JSON.parse(content);
	let lowncId = ncId.toLowerCase();
	if(jsoncontent[lowncId])
		return jsoncontent[lowncId];
	else
		console.log("This project doesn't exist");
		return 1;
}
