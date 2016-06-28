"use strict";
var StepNC = require('../../../../../NC.js/build/Release/StepNC');
var file = require('./file');
var fs = require('fs')
var app;


var _getchangelog = function(req,res){
    fs.readFile("changelog.md", "utf8", function(err,data){
      if(err) {
        return console.log(err);
      }
      res.status(200).send(data);
    })


}

module.exports = function(app, cb) {
  app.router.get('/log', _getchangelog);
  if (cb) cb();
};
