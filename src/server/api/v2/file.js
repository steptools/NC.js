"use strict";
var StepNC = require('../../../../../StepNCNode/build/Release/StepNC');
var fs = require("fs");
//Query for a json file that maps all projects in the data directory
//to a particular path in the data folder

var content = fs.readFileSync("data/pathmap.json");
var jsoncontent = JSON.parse(content);
var machineStates = {};
var getPath;
module.exports.getPath = function getPath(ncId){
	let lowncId = ncId.toLowerCase();
	if(jsoncontent[lowncId]){
		if (fs.existsSync(jsoncontent[lowncId])) {
	    	console.log('Found file');
		}
		else{
			console.log("THE FILE WAS NOT OPEN");
		}
		return jsoncontent[lowncId];
	}
	else
		console.log("This project doesn't exist");
	return 1;
}
getPath=module.exports.getPath;

module.exports.getMachineState = function (ncId) {
    var ncPath = getPath(ncId);
	if (typeof(machineStates[ncId]) === 'undefined') {
		machineStates[ncId] = new StepNC.machineState(ncPath);
		
	}
	return machineStates[ncId];
}
