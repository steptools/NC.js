var StepNC = require('../../../../../StepNCNode/build/Release/StepNC');
var fs = require("fs");
//Query for a json file that maps all projects in the data directory
//to a particular path in the data folder

function _getProjects(req, res){
	console.log("\n *START* \n");
	var content = fs.readFileSync("data/pathmap.json");
	console.log("Output Content : \n"+ content);
	console.log("\n *EXIT* \n");
}

function _getSpecProject(req, res){
	console.log("\n *START* \n");
	var content = fs.readFileSync("data/pathmap.json");
	var jsoncontent = JSON.parse(content);
	console.log("Specific Project: " + jsoncontent[req.params.ncId]);
}


module.exports = function(app, cb){
	app.router.get('/v2/nc/projects/', _getProjects);
	app.router.get('/v2/nc/projects/:ncId', _getSpecProject);
}