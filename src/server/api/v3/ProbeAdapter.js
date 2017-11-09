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
let net = require('net');
let server = net.createServer((socket)=>{
});
let ports = [];
let program ="";
let ping = (data,socket)=>{
    socket.write("* PONG 10000\n");
};
server.listen(7878);
server.on('connection',(socket)=>{
    console.log("connection");
    socket.setKeepAlive({enable:true});
    socket.setNoDelay(true);
    socket.on('data',(r)=>{
        ping(r,socket);
    });
    socket.write(new Date(Date.now()).toISOString()+"|pprogram|"+program+"\n");
    let socketpos = (ports.push(socket) - 1);
    socket.on('close',()=>{ports.splice(socketpos,1);});
});

let sendClients = (msg)=>{
    ports.forEach((client)=>{
        client.write(msg+"\n",()=>{});
    });
};

let setID = (name)=>{
    program=name;
    sendClients(new Date(Date.now()).toISOString()+"|pprogram|"+program+"\n");
};
module.exports.write = sendClients;
module.exports.ProgramID = setID;
