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
                                    case "Mp1LPathPos":
                                        process.send({'pathUpdate':g._});
                                        break;
                                }
                            });
                        });
                    });
                    _.each(e.Events,(f)=>{
                        _.forIn(f,(val)=>{
                            _.each(val,(g)=>{
                                switch(g.$.dataItemId){
                                    case "Mp1BlockNumber":
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
