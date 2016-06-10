"use strict"
var StepNC = require('../../../../../StepNCNode/build/Release/StepNC');
var find = new StepNC.Finder();

function _exeFromId(id){
	let ws = {
		"id": id,
		"name": find.GetExecutableName(id)
	}
	
	if (find.IsWorkingstep(id)) {
		ws["type"] = "workingstep";
		return ws;
	} else if (find.IsSelective(id)) {
		ws["type"] = "selective";
	} else if (find.IsWorkplan(id)) {
		ws["type"] = "workplan";
	}
	
	ws["children"] = find.GetNestedExecutableAll(id).map(_exeFromId);
	return ws;
}

function _getws(ncId, wsId){
		find.OpenProject(ncId);
		let rtn = _exeFromId(wsId);
		return rtn;
}

console.log(_getws("model.stpnc", 94989));
