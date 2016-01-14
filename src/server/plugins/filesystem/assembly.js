/* Copyright G. Hemingway, 2015 - All rights reserved */
"use strict";


var path                = require('path'),
    request             = require('request'),
    fs                  = require('fs'),
    _                   = require('lodash'),
    http                = require('http');
var app, rootDir;

/************************************************************************/

/*
 * Fetch a model for visualization
 *
 * @param {req.body.username} Username being logged into
 * @param {req.body.password} Password for the account
 * @return {200,username} Successful login yields the username
 */
var _fetch = function(req, res) {
    var dirPath, filename;

    // Handle assemblies
    if (req.params.assemblyId && req.params.shellId) {
        dirPath = path.join(rootDir, req.params.assemblyId);
        filename = 'shell_' + req.params.shellId + '.json';
        app.logger.debug('Assembly Shell: ' + filename);
    } else if (req.params.assemblyId && req.params.annoId) {
        dirPath = path.join(rootDir, req.params.assemblyId);
        filename = 'annotation_' + req.params.annoId + '.json';
        app.logger.debug('Assembly Annotation: ' + filename);
    } else if (req.params.assemblyId && req.params.batchId) {
        var type = req.headers['content-type'] === 'application/arraybuffer' ? '.tyson' : '.json';
        dirPath = path.join(rootDir, req.params.assemblyId);
        filename = 'batch' + req.params.batchId + type;
        app.logger.debug('Assembly Batch: ' + filename);
    } else if (req.params.assemblyId) {
        dirPath = path.join(rootDir, req.params.assemblyId);
        filename = 'index.json';
        app.logger.debug('Assembly: ' + req.params.assemblyId);
    }
    res.status(200).sendFile(filename, { root: dirPath });
};

function download(url, dest, cb) {
  request(url).pipe(fs.createWriteStream(dest)).on('close', cb);
};

var _fetchWithProxy = function(req, res) {
    var projectId, filename, type = 'json';

    // Handle assemblies
    if (req.params.assemblyId && req.params.shellId) {
        projectId = req.params.assemblyId;
        filename = 'shell_' + req.params.shellId + '.json';
    } else if (req.params.assemblyId && req.params.annoId) {
        projectId = req.params.assemblyId;
        filename = 'annotation_' + req.params.annoId + '.json';
    } else if (req.params.assemblyId && req.params.batchId) {
        type = req.headers['content-type'] === 'application/arraybuffer' ? '.tyson' : '.json';
        projectId = req.params.assemblyId;
        filename = 'batch' + req.params.batchId + type;
    } else if (req.params.assemblyId) {
        projectId = req.params.assemblyId;
        filename = 'index.json';
    }

    // FIXME: We shouldn't need to download the file to the disk at all-
    // however there were some problems with Tyson interpretation on the client
    var savePath =  path.join(rootDir, 'temp');
    var url = "http://127.0.0.1:8081/files/" + projectId + "/cadjs/" + filename;
    download(url, path.join(savePath, filename), function(){
      res.status(200).sendFile(filename, { root: savePath });
    });

};

/************************************************************************/

module.exports = function(globalApp) {
    app = globalApp;
    rootDir = path.join(app.config.rootDir, app.config.storage.options.dir);
    app.logger.info('\tAssembly Root: ' + rootDir);
    app.router.get('/v1/assembly/:assemblyId',                      _fetch);
    app.router.get('/v1/assembly/:assemblyId/batch/:batchId',       _fetch);
    app.router.get('/v1/assembly/:assemblyId/shell/:shellId',       _fetch);
    app.router.get('/v1/assembly/:assemblyId/annotation/:annoId',   _fetch);

    app.router.get('/v1/cloudassembly/:assemblyId',                      _fetchWithProxy);
    app.router.get('/v1/cloudassembly/:assemblyId/batch/:batchId',       _fetchWithProxy);
    app.router.get('/v1/cloudassembly/:assemblyId/shell/:shellId',       _fetchWithProxy);
    app.router.get('/v1/cloudassembly/:assemblyId/annotation/:annoId',   _fetchWithProxy);
};
