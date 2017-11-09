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
let StepNC = require('STEPNode');
let readline = require('readline');
let ms = {};
let parseMessage =
  (f)=>{
    if(f.msg==='setMachineState') {
      if(f.tool) {
        ms = new StepNC.machineState(f.path, f.sim,f.tool);
      } else {
        ms = new StepNC.machineState(f.path, f.sim);        
      }
    } else if(f.msg==='getMachine') {
      let out;
      if(!f.hasOwnProperty('args') || Object.keys(f.args).length <0) {
        Promise.resolve(ms[f.fun]()).then((r)=> {
          process.send({'cb': f.callback, 'val': r});
        });
      } else {
        if(!f.args.hasOwnProperty('length')){
          f.args.length = Object.keys(f.args).length;
        }
        //Node Native Module calls need to invoke apply with the relevant object.
        //This next line is hairy, but it basically invokes the function our caller wants with the arguments array we have
        Promise.resolve(ms[f.fun].apply(ms,Array.prototype.slice.call(f.args)))
          .then((r)=>{
            process.send({'cb': f.callback, 'val': r});
          });
      }
    }
  };

process.on('message',parseMessage);

let rl = readline.createInterface({input:process.stdin,output:process.stdout});
rl.on('line',(input)=>{
  let i = JSON.parse(input);
  parseMessage(i);
});

console.log('MachineState worker started PID %s\r\n',process.pid);

//Make sure event loop doesn't die.
let a = ()=>{setTimeout(a,100);};
a();
