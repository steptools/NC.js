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
let xml2js = require('xml2js');
let getMultipartRequest = require(process.cwd()+'/src/server/api/v3/getmultipartrequest.js');
let _ = require('lodash');
let readline = require('readline');

let dump=1;
var updateLoop = function(data){
    xml2js.parseString(data,(err,res)=>{
        if(err){
            console.log(err);
            return;
        }
        if(res===undefined || res.MTConnectStreams.Streams === undefined || res.MTConnectStreams.Streams[0] ==='' ) return;
        //Need to parse samples and events.
        //Important things are:
        //MS1speed (spindle speed update)
        //Mp1LPathPos (tool position update)
        //Mp1BlockNumber (gcode update)
        //Mp1block (gcode update)
        //Mp1Fact (feedrate update)
        try{
            let movevars = {};
            _.each(res.MTConnectStreams.Streams[0].DeviceStream[0].ComponentStream,
                (e)=>{
                    _.each(e.Samples,(f)=>{
                        _.forIn(f,(val)=>{
                            _.each(val,(g)=>{
                                switch(g.$.dataItemId){
                                    case "MS1speed":
                                        process.send({'speedUpdate':g._});
                                        break;
                                    case "Mp1Fact":
                                        process.send({'feedUpdate':g._});
                                        break;
                                    case "MX1actm":
                                      if(movevars[g.$.timestamp]) movevars[g.$.timestamp].x=g._;
                                      else movevars[g.$.timestamp] = {x:g._};
                                      break;
                                    case "MY1actm":
                                      if(movevars[g.$.timestamp]) movevars[g.$.timestamp].y=g._;
                                      else movevars[g.$.timestamp] = {y:g._};
                                      break;
                                    case "MZ1actm":
                                      if(movevars[g.$.timestamp]) movevars[g.$.timestamp].z=g._;
                                      else movevars[g.$.timestamp] = {z:g._};
                                      break;
                                    case "MB1actm":
                                      if(movevars[g.$.timestamp]) movevars[g.$.timestamp].b=g._;
                                      else movevars[g.$.timestamp] = {b:g._};
                                      break;
                                    case "MC2actm":
                                      if(movevars[g.$.timestamp]) movevars[g.$.timestamp].c=g._;
                                      else movevars[g.$.timestamp] = {c:g._};
                                      break;
                                }
                            });
                        });
                    });
                    _.each(e.Events,(f)=>{
                        _.forIn(f,(val)=>{
                            _.each(val,(g)=>{
                                switch(g.$.dataItemId){
                                    case "path22_01":
                                        process.send({'blockNumberUpdate':g._});
                                        break;
                                    case "Mp1block":
                                        process.send({'blockUpdate':g._});
                                        break;
                                }
                            });
                        });
                    });
                });
            _.each(movevars,(v,key)=>{
                process.send({'positionUpdate':v});
            })
        } catch(e){
            console.log(e);
        }
    })
};

let parseMessage = (f)=>{
    if(f.msg==='start'){
        getMultipartRequest({'hostname':f.machineAddress,'port':f.machinePort,'path':'/sample?from='+f.startSequence+'&interval=0&heartbeat=10000'},(r)=>{updateLoop(r);});
    }
};

let rl = readline.createInterface({input:process.stdin,output:process.stdout});
rl.on('line',(input)=>{
    let i = JSON.parse(input);
    parseMessage(i);
});

console.log('ParseThread worker started PID %s\r\n',process.pid);
