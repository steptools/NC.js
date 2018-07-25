/* 
 * Copyright (c) 2016-2017 by STEP Tools Inc. 
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
var file = require('./file');
var find = file.find;
var apt = file.apt;
var step = require('./step');

var request = require('superagent');
var parseXMLString = require('xml2js');
var _ = require('lodash');
var fs = require('fs');

var Worker = require('child_process');
let worker = Worker.fork('./src/server/api/v3/parseupdatethread.js',{silent:true});
worker.stdout.pipe(process.stdout);
worker.stderr.pipe(process.stderr);

var app;
var loopTimer;
var loopStates = {};
let path = find.GetProjectName();
let init = false;

var WSGCodeIndex = 0;
var WSGCode = [];
var WSArray = [];
let nextSequence = 0;
let changed=false;

let MTCHold = {'feedrateUnits':'Millimeters/Second'};

let currentMachine = 0;

let keyCache = {};
let deltaCache = {};

var xCur = 0;
var yCur = 0;
var zCur = 0;
var aCur = 0;
var cCur = 0;
/****************************** Helper Functions ******************************/

function getWorkingstepsArray(id){
  if(!find.IsEnabled(id)) return;
  if(find.IsWorkingstep(id)){
    WSArray.push(id);
  }
  if (!find.IsWorkingstep(id) && !find.IsNcFunction(id)) {
    let children = find.GetNestedExecutableAll(id);
    if (children !== undefined) {
      children.map((child) => getWorkingstepsArray(child));
    }
  }
}

function workingstepsArrayDriver(){
  let id = find.GetMainWorkplan();
  getWorkingstepsArray(id);
}

function update(val) {
  app.ioServer.emit('nc:state', val);
}

function updateSpeed(speed) {
  app.ioServer.emit('nc:speed', speed);
}

function updateMTC(){
  app.ioServer.emit('nc:mtc',MTCHold);
}


var findWS = function(current) {
  var change = false;

  if (current < WSGCode.worksteps[WSGCodeIndex]) {
    WSGCodeIndex = 0;
    change = true;
    //app.logger.debug("Starting from 0");
  }

  while (current > WSGCode.worksteps[WSGCodeIndex + 1]) {
    WSGCodeIndex = WSGCodeIndex + 1;
    change = true;
    if (WSGCodeIndex === WSGCode.worksteps.length - 1) {
      break;
    }
  }

  return change;
};

var BaseOptFeed = (lineNumber)=>{
  if(WSGCode.feeds[lineNumber]){
    return WSGCode.feeds[lineNumber];
  }else{
    return {base:-1,optimized:-1};
  }
}

let startSequence = "";
let xOff = Number(0);
let yOff = Number(0);
let zOff = Number(0);
let aOff = Number(0);
let cOff = Number(0);
var loadMTCHold = (addr,port)=>{
  return new Promise((resolve)=>{
    request
    .get(addr+":"+port+"/current")
      .then((res) => {
        parseXMLString.parseString((res.text), (err, result) => {
          startSequence = result.MTConnectStreams.Header[0]['$'].nextSequence;
          let find = result.MTConnectStreams.Streams[0].DeviceStream[0].ComponentStream;
          console.log(find);
          let spindletag = _.find(find, (tag) => {
            if (tag.$.name === 'SPI1' && tag.$.component === 'Rotary') {
              return true;
            } else {
              return false;
            }
          });
          let pathtag = _.find(find, (tag) => {
            if (tag.$.name === 'p1') {
              return true;
            } else {
              return false;
            }
          });
	  let xtag = _.find(find, (tag) =>{
	    return(tag.$.name ==='X1' && tag.$.component === 'Linear');
	  });
	  let ytag = _.find(find, (tag) =>{
	    return(tag.$.name ==='Y1' && tag.$.component === 'Linear');
	  });
	  let ztag = _.find(find, (tag) =>{
	    return(tag.$.name ==='Z1' && tag.$.component === 'Linear');
	  });
	  let atag = _.find(find, (tag) =>{
	    return(tag.$.name ==='A1' && tag.$.component === 'Rotary');
	  });
	  let ctag = _.find(find, (tag) =>{
	    return(tag.$.name ==='C1' && tag.$.component === 'Rotary');
	  });
	  xCur=Number(xtag.Samples[0].Position[0]._);	  
	  yCur=Number(ytag.Samples[0].Position[0]._);	  
	  zCur=Number(ztag.Samples[0].Position[0]._);	  
	  aCur=Number(atag.Samples[0].Angle[0]._);	  
	  cCur=Number(ctag.Samples[0].Angle[0]._);
          MTCHold.live = true;
          spindleUpdate(spindletag.Samples[0].RotaryVelocity[1]._);
          feedUpdate(pathtag.Samples[0].PathFeedrate[1]._);
          //blockUpdate(pathtag.Events[0]['e:BlockNumber'][0]._, pathtag.Events[0].Block[0]._);
          _.each(pathtag.Events[0]['e:Variables'],(g)=>{
            switch(g.$.subType){
              case 'x:WORKOFFSET_X_AXIS':
                xOff=Number(g._);
              break;
              case 'x:WORKOFFSET_Y_AXIS':
                yOff=Number(g._);
              break;
              case 'x:WORKOFFSET_Z_AXIS':
                zOff=Number(g._);
              break;
              case 'x:WORKOFFSET_A_AXIS':
                aOff=Number(g._);
              break;
              case 'x:WORKOFFSET_C_AXIS':
                cOff=Number(g._);
              break;
            }
          });
          file.ms.SetWorkpieceOffset(xOff,yOff,zOff,aOff,cOff);
          //pathUpdate(pathtag.Samples[0].PathPosition[0]._);
          resolve();
        });
})
.catch((err)=>{
    console.log(err);
  resolve();
});
});
};

function getNext(ms) {
  return ms.NextWS();
}

function getPrev(ms) {
  return ms.PrevWS();
}

function getToWS(wsId, ms) {
  return ms.GoToWS(wsId);
}

//==========STATE UPDATERS==============
//Handle Mp1BlockNumber, Mp1Block
var blockUpdate=function(number,block){
  let change = false;
  if(number!=undefined && number!==MTCHold.currentGcodeNumber){
    MTCHold.currentGcodeNumber = number;
    let feeds = BaseOptFeed(number);
    MTCHold.baseFeed = feeds.base;
    MTCHold.optimizedFeed = feeds.optimized;
    change = true;
    numchange = true;
  }
  if(block!==undefined && block !=="" && block!=MTCHold.currentGcode){
    MTCHold.currentGcode = block;
    change = true;
  }
  if(change) {
    if(numchange){
      file.ms.GoToWS(WSArray[MTCHold.currentGcodeNumber])
          .then(()=> {
            return file.ms.GetKeyStateJSON();
          }).then((r)=>{
            let key = JSON.parse(r);
            keyCache = key;
            return app.updateDynamic();
          }).then(()=>{
            app.ioServer.emit('nc:delta',keyCache);
          });
    }
    updateMTC();
  }
};
//Handle MS1speed
var spindleUpdate=function(speed){
  if(speed!== MTCHold.spindleSpeed){
    MTCHold.spindleSpeed = speed;
    updateMTC();
  }
};
//Handle Mp1LPathPos
var pathUpdate=function(){
  return new Promise((resolve)=>{
    file.ms.SetToolPosition(xCur,yCur,zCur,aCur,cCur)
        .then((r)=> {
          if(r.more === true) {
            resolve();
            throw 'more';
          }
          return file.ms.GetDeltaStateJSON();
        }).then((d)=> {
          deltaCache = JSON.parse(d);
          return app.updateDynamic();
        }).then(()=> {
          app.ioServer.emit('nc:delta', deltaCache);
          resolve();
          return;
        }).catch(()=>{
          return;
        });
  });
  return;
};
//Handle Mp1Fact
var feedUpdate=function(feedrate){
  if(feedrate!==MTCHold.feedrate) {
    MTCHold.feedrate = feedrate;
      updateMTC();
  }
};
var xUpdate = (val,noUpdate)=>{
  val = Number(val);
  if(val!== xCur){
    xCur = val;
    if(!noUpdate) pathUpdate();
    return true;
  }
  return false;
}
var yUpdate = (val,noUpdate)=>{
  val = Number(val);
  if(val!== yCur){
    yCur = val;
    if(!noUpdate)pathUpdate();
    return true;
  }
  return false;
}
var zUpdate = (val,noUpdate)=>{
  val = Number(val);
  if(val!== zCur){
    zCur = val;
    if(!noUpdate)pathUpdate();
    return true;
  }
  return false;
}
var aUpdate = (val,noUpdate)=>{
  val = Number(val);
  if(val!== aCur){
    aCur = val;
    if(!noUpdate)pathUpdate();
    return true;
  }
  return false;
}
var cUpdate = (val,noUpdate)=>{
  val = Number(val);
  if(val!== cCur){
    cCur = val;
    if(!noUpdate)pathUpdate();
    return true;
  }
  return false;
}
var posUpdate = (val)=>{
  let changed = false;
  if(val.x){
    changed |= xUpdate(val.x,true);
  }
  if(val.y){
    changed |= yUpdate(val.y,true);
  }
  if(val.z){
    changed |= zUpdate(val.z,true);
  }
  if(val.a){
    changed |= aUpdate(val.a,true);
  }
  if(val.c){
    changed |= cUpdate(val.c,true);
  }
  if(changed) pathUpdate();
  if(val.w){
    blockUpdate(val.w);
  }
}

var probeUpdate = (val)=>{
  var regex = "feature: \"(.+)\", order:([0-9]+) count:([0-9]+) id:\".+\" x:([0-9.]+) y:([0-9.]+) z:([0-9.]+)";
  var result = val.match(regex);
  if(!result) return;
  file.tol.ReportProbeResult(result[1],Number(result[2]),Number(result[3]),Number(result[4]),Number(result[5]),Number(result[6]));
}
//==========END STATE UPDATERS==========
//==========WORKER THREAD PROCESSOR=====
worker.on('message',(ev)=> {
  _.forIn(ev, (val, key)=> {
    switch (key) {
      case "positionUpdate":
        posUpdate(val);
        break;
      case "pathUpdate":
        pathUpdate(val);
        break;
      case "xUpdate":
        xUpdate(val);
        break;
      case "yUpdate":
        yUpdate(val);
        break;
      case "zUpdate":
        zUpdate(val);
        break;
      case "aUpdate":
        aUpdate(val);
        break;
      case "cUpdate":
        cUpdate(val);
        break;
      case "feedUpdate":
        feedUpdate(val);
        break;
      case "speedUpdate":
        spindleUpdate(val);
        break;
      case "blockUpdate":
        blockUpdate(undefined,val);
        break;
      case "probeUpdate":
        probeUpdate(val);
        break;
      case "blockNumberUpdate":
        //blockUpdate(val);
        break;
    }
  });
});
//==========END PROCESSOR===============

let mtcFile = null;
var makeMTC = function(fname){
  return new Promise((resolve)=>{let GCodeFile = fname+".min";
    fs.readFile(GCodeFile, function(err, res) {
      let MTCcontent = [];
      let GCcontent = [];
      let MTCFname = fname+".mtc";
      let lineNumber = 0;
      let GCodes = null;
      let FeedContent = {};

      let feed_re = /\FEED OVERRIDE ([\d.]+) X ([\d.]+)/;
      let feed_parse;

      if (res) {
        GCodes = res.toString().split('\r\n');
      }
      _.each(GCodes, function(line) {
        if (line[0] === '(') {
          if (line.substring(1, 12) === 'WORKINGSTEP') {
            MTCcontent.push(lineNumber);
          }
	  else if (feed_parse = line.match(feed_re)){
	      let basefeed = new Number(feed_parse[1]);
	      let percent = new Number(feed_parse[2]);

	      let optfeed = basefeed * percent / 100;

            FeedContent[lineNumber+1] = {};
//	      console.log ("Base=" + base + "  percent=" + percent);
              FeedContent[lineNumber+1].optimized = optfeed;
              FeedContent[lineNumber+1].base = basefeed;
          }
        } else {
          if (line.substring(0,2) != 'IF') {
            GCcontent.push(line);
            lineNumber++;
          }
        }
      });
      MTCcontent[0]=0; //First WS can include pre-setup info
      let rtn = {worksteps:MTCcontent,feeds:FeedContent,GCode:GCcontent};
      fs.writeFile(MTCFname,
          JSON.stringify(rtn,null,1),
          (err)=>{
            if(err) console.log(err);
            resolve(rtn);
          });
    });
  });
};
var parsePromise = null; //For preventing race conditions
var parseGCodes = function(fname) {
  let MTCFname = fname+'.mtc';
  if(!parsePromise) {
    parsePromise = new Promise(function (resolve) {
      if (mtcFile){
        parsePromise = null;
        resolve(mtcFile);
      }
      fs.readFile(MTCFname, function (err, res) {
        if (err) { //No MTC File, make it.
          makeMTC(fname)
          .then((rtn)=> {
            mtcFile = rtn;
            parsePromise = null;
            resolve(rtn);
          });
        }
        else { //Read from MTC File.
          mtcFile = JSON.parse(res.toString());
          parsePromise = null;
          resolve(mtcFile);
        }
      });
    });
  }
  return parsePromise;
};

/***************************** Endpoint Functions *****************************/
var _gotows = (req,res)=>{
  if(loopStates[path] === true) res.status(200).send();
  file.ms.GoToWS(Number(req.params.wsid)).then(()=>{
    res.status(200).send();
  });
}

var _loopInit = function(req, res) {

  if(!init){
    init = true;
    workingstepsArrayDriver();
  }

  parseGCodes(app.project.substring(0,app.project.length-6))
      .then((parsed)=>{
        WSGCode = parsed;
        if (req.params.loopstate === undefined) {
          if (loopStates[path] === true) {
            res
                .status(200)
                .send(JSON.stringify({'state': 'play', 'speed': '100'}));
          } else {
            res
                .status(200)
                .send(JSON.stringify({'state': 'pause', 'speed': '100'}));
          }
        } else {
          let loopstate = req.params.loopstate;
          var ms = file.ms;
          if (typeof loopStates[path] === 'undefined') {
            loopStates[path] = false;
          }

          switch (loopstate) {
            case 'start':
              if (loopStates[path] === true) {
                res.status(200).send('Already running');
                return;
              }
              // app.logger.debug('Looping ' + path);
              loopStates[path] = true;
              res.status(200).send('OK');
              update('play');
              console.log('starting...');
              //file.ms.SetBCMode(true);
              let machineAddress = app.config.machineList[0].address.split(':')[0];
              let machinePort = app.config.machineList[0].address.split(':')[1];
              loadMTCHold(machineAddress,machinePort)
                  .then(()=>{
                    let message = {
                      'msg':'start',
                      'machineAddress':machineAddress,
                      'machinePort':machinePort,
                      'startSequence':startSequence
                    };
                    worker.stdin.write(JSON.stringify(message)+'\n');
                  });
              break;
            case 'stop':
              if (loopStates[path] === false) {
                res.status(200).send('Already stopped');
                return;
              }
              loopStates[path] = false;
              update('pause');
              res.status(200).send('OK');
              break;
            default:
              if (!isNaN(parseFloat(loopstate)) && isFinite(loopstate)) {
                if (loopStates[path] === true) {
                  res
                      .status(200)
                      .send(JSON.stringify({
                        'state': 'play',
                      }));
                } else {
                  res
                      .status(200)
                      .send(JSON.stringify({
                        'state': 'pause',
                      }));
                }
              }
          }
        }
      });
};

var _getKeyState = function (req, res) {
  if(!_.isEmpty(keyCache)) {
    res.status(200).send(keyCache);
    return;
  }
  var ms = file.ms;
  if (ms === undefined) {
    res.status(404).send('Machine state could not be found');
    return;
  }
  ms.GetKeyStateJSON()
      .then((r)=>{
        keyCache = JSON.parse(r);
        return app.updateDynamic();
      }).then(()=>{
        res.status(200).send(keyCache);
      });
};

var _getDeltaState = function (req, res) {
  if(!_.isEmpty(deltaCache)){
    res.status(200).send(deltaCache);
    return;
  }
  var ms = file.ms;
  if (ms === undefined) {
    res.status(404).send('Machine state could not be found');
    return;
  }
  ms.GetDeltaStateJSON()
      .then((r)=>{
        deltaCache = JSON.parse(r);
        return app.updateDynamic();
      }).then(()=>{
        res.status(200).send(deltaCache);
      });
};

var _saveDeltaState = function (req,res) {
  if(file.ms === undefined) {
    res.status(404).send('Machine state could not be found');
    return;
  }
  let fname = find.GetProjectName();
  file.ms.WriteDynamicGeometrySTEP(fname+"delta.stp");
  res.status(200).send();
  return;
}

var _getMTCHold = function (req, res) {
  res.status(200).send(MTCHold);
};

let _machineInfo = (req, res) => {
  if (req.params.id) {
    currentMachine = Number(req.params.id);
    res.status(200).send('OK');
  } else {
    res.status(200).send(currentMachine.toString());
  }
};

let _getAllMachines = (req, res) => {
  res.status(200).send(app.config.machineList);
}

module.exports = function(globalApp, cb) {
  app = globalApp;
  app.router.get('/v3/nc/state/key', _getKeyState);
  app.router.get('/v3/nc/state/delta', _getDeltaState);
  app.router.get('/v3/nc/state/delta/save', _saveDeltaState);
  app.router.get('/v3/nc/state/loop/:loopstate', _loopInit);
  app.router.get('/v3/nc/state/loop/', _loopInit);
  app.router.get('/v3/nc/state/mtc', _getMTCHold);
  app.router.get('/v3/nc/state/ws/:wsid', _gotows);
  app.router.get('/v3/nc/state/machine/:id', _machineInfo);
  app.router.get('/v3/nc/state/machine', _machineInfo);
  app.router.get('/v3/nc/state/machines', _getAllMachines);
  if (cb) {
    cb();
  }
};
