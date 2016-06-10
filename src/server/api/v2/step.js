"use strict";
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

function _getws(req,res){
	if(req.params.ncId && req.params.wsId){
		let ncId = req.params.ncId;
		let wsId = req.params.wsId;
		var id_new = parseInt(wsId);
		find.OpenProject(ncId);
		res.status(200).send(_exeFromId(id_new));
	}
}

module.exports = function(app, cb){
	app.router.get('/v2/nc/:ncId/plan/:wsId',_getws);
}
