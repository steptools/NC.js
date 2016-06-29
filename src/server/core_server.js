/* Copyright G. Hemingway, 2015 - All rights reserved */
"use strict";

var http        = require('http'),
    path        = require('path'),
    _           = require('lodash'),
    opts        = require('commander'),
    winston     = require('winston'),
    configurator= require('./configurator'),

    fileobj     = require('./api/v2/file.js');
/*****************************************************************************************/
var app;
//console.log(fileobj);
function CoreServer() {
    var pjson = require('../../package.json');
    opts
        .version(pjson.version)
        .option('-p, --port [port]', 'Port on which to run the server [8080]', '')
        .option('-c, --config [file]', 'Configuration File [./config/config.json]', './config/config.json')
        .option('-e, --environment [env]', 'Environment to use [development]', 'development')
        .option('-t, --tool [tool-file]', 'Machine tool file to use [""]', '')
        .option('-f, --filepath [stp-filepath]', 'Step NC filepath to use [""]', '')
        .parse(process.argv);
    this.config = configurator(opts.config, opts.environment);
    this.port = opts.port || this.config.port || 8080;

    // set up machine tool option
    this.machinetool = opts.tool;

    // set up filepath option
    this.project = opts.filepath;
    //console.log("THIS IS MY PROJECT" + this.project);
    this.nc = fileobj.NC(this);
    //console.log(fileobj);
    //console.log(this);
    //console.log(this.nc);

    // Establish core
    this.models = {};
    this.controllers = {};
    this.logger = new winston.Logger({
        transports: [
            new (winston.transports.Console)({ level: 'debug' })
        ]
    });
    // Setup the rest of the primary infrastructure connections
}

CoreServer.prototype._setControllers = function() {
    this.controllers = {
//        Attachment:         require('./core/controllers/attachment')(this),
//        Comment:            require('./core/controllers/comment')(this),
//        Email:              require('./core/controllers/email')(this),
//        Group:              require('./core/controllers/group')(this),
//        Mailbox:            require('./core/controllers/mailbox')(this),
//        Member:             require('./core/controllers/member')(this),
//        Notification:       require('./core/controllers/notification')(this),
//        Permission:         require('./core/controllers/permission')(this),
//        Project:            require('./core/controllers/Project')(this),
//        Role:               require('./core/controllers/role')(this),
//        Search:             require('./core/controllers/search')(this),
//        Tool:               require('./core/controllers/tool')(this),
//        ToolInstance:       require('./core/controllers/tool_instance')(this),
//        User:               require('./core/controllers/user')(this)
    };
};

/*****************************************************************************************/

module.exports = CoreServer;