"use strict";
var request = require('request');

function getFromStepInterface(id,action){
	var si = getStepInterface(id);
	var rtn = action(si);
	return rtn;
}
