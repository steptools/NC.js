"use strict"
var StepNC = require('../../../../../StepNCNode/build/Release/StepNC');
var find = new StepNC.Finder();

function _exeFromId(wp){
	let exes = find.GetNestedExecutableAll(wp);
	if (exes.length == 1) {
		rtn.push(exes);
	} else {
		exes.map(_exeFromId);
	}
}

//function _getws(req,res){
	//if(req.params.ncId && req.params.wsId){
function _getws(A, B){
		//let ncId = req.params.ncId;
		//let wsId = req.params.wsId;
		let ncId = A;
		let wsId = B;
		find.OpenProject(ncId);
		var rtn = {
			"id": wsId, 
			"name": find.GetWorkplanName(wsId), 
			"type": "workingstep",
			"children": _exeFromId(wsId)
		};
		//res.send(rtn);
	//}
}

console.log(_getws("model.stpnc", 89308));

module.exports = function(app, cb){
	//app.router.get('/v2/nc/:ncId/plan/:wsId',_getws);
}
