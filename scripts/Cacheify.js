'use strict';
let configurator = require('../config');
let config = configurator('development');
let file = require('../src/server/api/v3/file.js');
if(config.file !== undefined && config.file.dir !== undefined){
  if(config.machine !== undefined && config.machine.dir !== undefined){
    file.init(config.file.dir,config.machine.dir);
  }else{
    file.init(config.file.dir);
  }
}
let scache = require('../src/server/api/v3/statecache.js');
scache.Initialize()
  .then(()=>{
    scache.CreateCache();
  });
