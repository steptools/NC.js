'use strict';
let StepNC = require('STEPNode');
let fs = require('fs');
let _ = require('lodash');
let Worker = require('child_process');
let worker = Worker.fork('./src/server/api/v3/machinestatethread.js',{silent:true});
worker.stdout.pipe(process.stdout);
worker.stderr.pipe(process.stderr);
let Path = require('path');
let resolves = {};

let project = '';


let waittosend=false;
worker.on('message',(ev)=>{
  let cb = eval(ev.cb);
  cb(ev.val);
});
worker.on('error',(err)=>{
  console.log(err);
});
let drainqueue=[];
let runningdrainqueue=false;
let emptydrainqueue = ()=>{
  if (runningdrainqueue) {
    return;
  }
  runningdrainqueue = true;
  while (!_.isEmpty(drainqueue) && !waittosend) {
    let msg = drainqueue.shift();
    let shouldntwait = worker.stdin.write(JSON.stringify(msg) + '\r\n');
    waittosend = !shouldntwait;
  }
  runningdrainqueue=false;
};
worker.stdin.on('drain',()=>{
  waittosend=false;
  emptydrainqueue();
});

let msid = 0;

function openSimpleNcs(path){
  this.apt = new StepNC.AptStepMaker();
  this.find = new StepNC.Finder();

  this.apt.OpenProject(path);
  this.find.OpenProject(path);

  this.tol = new StepNC.Tolerance(); //tol keys off of apt.
}
function openMachineState(path,tool){
  let setms ={'msg':'setMachineState','path':path,'sim':true};
  if (tool!=='') {
    setms.tool = tool;
  }
  worker.stdin.write(JSON.stringify(setms)+'\r\n');
  this.ms = {};
  //Makes a function for the worker that looks like
  //(data)=>{
  //  resolves[12](data);
  //  resolves[12]=null;
  //  data=null;
  //};
  let workerstring = (id)=>{
    return '(data)=>{resolves['+id+
      '](data);resolves['+id+']=null;data=null;};';
  };
  //Map STEPNode.machineState functions to worker-thread message calls.
  //It's kinda like black magic.
  //Should be deprecated by actual promise-based implementation of STEPNode.
  _.forIn(StepNC.machineState.prototype,(val,key)=>{
    this.ms[key] = function(){
      return new Promise((resolve)=>{
        resolves[msid] = d=>resolve(d);
        let mas=workerstring(msid);
        let msg = {'msg':'getMachine','fun':key,'callback':mas};
        if (arguments.length>0) {
          msg['args']=arguments;
        }
        if (waittosend ===true) {
          drainqueue.push(msg);
        } else {
          let shouldntwait = worker.stdin.write(JSON.stringify(msg) + '\r\n');
          waittosend = !shouldntwait;
        }
        msid++;
      });
    };
  });
}
function init(path, machinetool) {
  fs.accessSync(path, fs.R_OK , () => process.exit());

  this.project = Path.basename(path,Path.extname(path));
  try {
    fs.accessSync(machinetool,fs.R_OK);
  } catch (e){
    machinetool='';
  }
  openSimpleNcs(path);
  openMachineState(path,machinetool);
	return;
}

module.exports.init = init;
module.exports.project = this.project;
module.exports.find = this.find;
module.exports.apt = this.apt;
module.exports.tol = this.tol;
module.exports.ms = this.ms;
