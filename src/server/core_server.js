/* Copyright G. Hemingway, 2015 - All rights reserved */
"use strict";

var opts         = require('commander'),
    winston      = require('winston'),
    configurator = require('../../config'),
    file         = require('./api/v3/file.js');
/*****************************************************************************************/

function CoreServer() {
    var pjson = require('../../package.json');
    opts
        .version(pjson.version)
        .option('-p, --port [port]', 'Port on which to run the server [8080]', '')
        .option('-c, --config [file]', 'Configuration File [./config/config.json]', './config/config.json')
        .option('-e, --environment [env]', 'Environment to use [development]', 'development')
        .option('-t, --tool [tool-file]', 'Machine tool file to use [""]', '')
        .option('-f, --file [filepath]', 'Step NC filepath to use [""]', '')
        .parse(process.argv);
    this.config = configurator(opts.config, opts.environment);
    this.port = opts.port || this.config.port || 8080;

    // set up machine tool option
    if(opts.tool)
        this.machinetool = opts.tool;
    else
        this.machinetool = this.config.machine.dir;

    // set up filepath option
    if(opts.file)
        this.project = opts.file;
    else
        this.project = this.config.file.dir;
    file.init(this.project, this.machinetool);

    // Establish core
    this.models = {};
    this.controllers = {};
    this.logger = new winston.Logger({
        transports: [
            new (winston.transports.Console)({ level: 'debug' })
        ]
    });
}

module.exports = CoreServer;