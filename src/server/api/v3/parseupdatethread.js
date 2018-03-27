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
let request = require('superagent');
let _ = require('lodash');
let readline = require('readline');

var updateLoop = function (data) {
    return new Promise((resolve) => {
        xml2js.parseString(data, (err, res) => {
            if (err) {
                resolve();
                return;
            }
            if (res === undefined || res.MTConnectStreams.Streams === undefined || res.MTConnectStreams.Streams[0] === "") {
                resolve();
                return;
            }
            //Need to parse samples and events.
            //Important things are:
            //MS1speed (spindle speed update)
            //Mp1LPathPos (tool position update)
            //Mp1BlockNumber (gcode update)
            //Mp1block (gcode update)
            //Mp1Fact (feedrate update)
            try {
                let rtn = Number(res.MTConnectStreams.Header[0]['$'].nextSequence);
                let movevars = {};
                _.each(res.MTConnectStreams.Streams[0].DeviceStream[0].ComponentStream,
                    (e) => {
                        _.each(e.Samples, (f) => {
                            _.forIn(f, (val) => {
                                _.each(val, (g) => {
                                    switch (g.$.dataItemId) {
                                        case "MS1speed":
                                            process.send({ 'speedUpdate': g._ });
                                            break;
                                        case "Mp1Fact":
                                            process.send({ 'feedUpdate': g._ });
                                            break;
                                        case "MX1actm":
                                            if (movevars[g.$.timestamp]) movevars[g.$.timestamp].x = g._;
                                            else movevars[g.$.timestamp] = { x: g._ };
                                            break;
                                        case "MY1actm":
                                            if (movevars[g.$.timestamp]) movevars[g.$.timestamp].y = g._;
                                            else movevars[g.$.timestamp] = { y: g._ };
                                            break;
                                        case "MZ1actm":
                                            if (movevars[g.$.timestamp]) movevars[g.$.timestamp].z = g._;
                                            else movevars[g.$.timestamp] = { z: g._ };
                                            break;
                                        case "A1actm":
                                            if (movevars[g.$.timestamp]) movevars[g.$.timestamp].a = g._;
                                            else movevars[g.$.timestamp] = { a: g._ };
                                            break;
                                        case "C21actm":
                                            if (movevars[g.$.timestamp]) movevars[g.$.timestamp].c = g._;
                                            else movevars[g.$.timestamp] = { c: g._ };
                                            break;
                                    }
                                });
                            });
                        });
                        _.each(e.Events, (f) => {
                            _.forIn(f, (val) => {
                                _.each(val, (g) => {
                                    switch (g.$.dataItemId) {
                                        case "Mp1BlockNumber":
                                            process.send({ 'blockNumberUpdate': g._ });
                                            break;
                                        case "Mp1block":
                                            process.send({ 'blockUpdate': g._ });
                                            break;
                                    }
                                });
                            });
                        });
                    });
                _.each(movevars, (v, key) => {
                    process.send({ 'positionUpdate': v });
                })
                resolve(rtn);
                return;
            } catch (e) {
                console.log(e);
                resolve();
                return;
            }
        })
    });
};

let continueParse = (f)=>{
    request.get(f.machineAddress+':'+f.machinePort+'/sample?from='+f.startSequence)
    .then((res)=>{
        return updateLoop(res.text);
    }).then((res)=>{
        if(res > f.startSequence) {
            f.startSequence = res;
        }
        return continueParse(f);
    });

}
let parseMessage = (f)=>{
    if(f.msg==='start'){
        continueParse(f);
        //getMultipartRequest({'hostname':f.machineAddress,'port':f.machinePort,'path':'/sample?from='+f.startSequence+'&interval=0&heartbeat=10000'},(r)=>{updateLoop(r);});
    }
};

let rl = readline.createInterface({input:process.stdin,output:process.stdout});
rl.on('line',(input)=>{
    let i = JSON.parse(input);
    parseMessage(i);
});

console.log('ParseThread worker started PID %s\r\n',process.pid);
