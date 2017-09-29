/* 
 * Copyright (c) 2016-2017 by STEP Tools Inc. 
 * Copyright G. Hemingway, 2015
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */

'use strict';

var opts = require('commander');
var winston = require('winston');
var file = require('./api/v3/file.js');
var fs = require('fs');
var path = require('path');
/******************************************************************************/

module.exports = class CoreServer{
  constructor(){
  var pjson = require('../../package.json');
  opts
    .version(pjson.version)
    .option(
      '-p, --port [port]',
      'Port on which to run the server [8080]',
      ''
    )
    .option(
      '-c, --config [file]',
      'Configuration File [./config.js]',
      './config.js'
    )
    .option(
      '-e, --environment [env]',
      'Environment to use [development]',
      'development'
    )
    .option(
      '-t, --tool [tool-file]',
      'Machine tool file to use [""]',
      ''
    )
    .option(
      '-f, --file [filepath]',
      'Step NC filepath to use [""]',
      ''
    )
    .option(
      '-n, --no-cache',
      'Run from simulation instead of cached data.'
    )
    .option(
      '-m, --mt-connect',
      'Run the MT Connect server mode. Implies --no-cache.'
    )
    .option(
      '--dump [path]',
      'Directory to dump failed isects into [""]',
      ''
    )
    .option(
      '--probe-adapter',
      "Run with a MT-Connect Adapter for logging probe results"
    )
    .parse(process.argv);
  let configurator = require(path.join(process.cwd(),opts.config));
  this.config = configurator(opts.environment);
  this.port = opts.port || this.config.port || 8080;
  if(opts.mtConnect) opts.cache = false;
  this.config.noCache = !opts.cache;
  this.config.mtConnect = opts.mtConnect;
  if(opts.dump) this.config.dump = opts.dump;
  if(opts.probeAdapter) {
    this.config.probeAdapter = true;
  }
  // set up machine tool option
  if(opts.tool && opts.tool!==''){
    try{
      fs.accessSync(opts.tool, fs.R_OK);
      this.machinetool = opts.tool;
    }
    catch(err){
      console.log('Given Tool Does Not Exist.');
      this.machinetool = null;
    }
  }
  else if(this.config.machine !== undefined && this.config.machine.dir !== undefined){
    if(this.config.machine.dir.trim() !== ""){
      try{
        fs.accessSync(this.config.machine.dir, fs.R_OK);
        this.machinetool = this.config.machine.dir;
      }
      catch(err){
        this.machinetool = null;
      }
    }
    else{        
      this.machinetool = null;
    }
  }
  else{
    this.machinetool = null;
  }
  // set up filepath option
  if(opts.file)
      this.project = opts.file;
  else
      this.project = this.config.file.dir;
  file.init(this.project, this.machinetool,this.config.dump,true);

  // Establish core
  this.logger = new winston.Logger({
    transports: [
      new (winston.transports.Console)({level: 'debug'}),
    ],
  });
}
}
