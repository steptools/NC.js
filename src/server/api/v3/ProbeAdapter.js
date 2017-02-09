'use strict';
let net = require('net');
let server = net.createServer((socket)=>{
});
let ports = [];
let program ="";
let ping = (data,socket)=>{
    socket.write("* PONG 10000");
};
server.listen(7878);
server.on('connection',(socket)=>{
    console.log("connection");
    socket.setKeepAlive({enable:true});
    socket.on('data',(r)=>{
        ping(r,socket);
    });
    socket.write(new Date(Date.now()).toISOString()+"|program|"+program);
    ports.push(socket);
});

let sendClients = (msg)=>{
    ports.forEach((client)=>{
        client.write(msg,()=>{console.log("wrote %j to %j",client,msg)});
    });
};

let setID = (name)=>{
    program=name;
    sendClients(new Date(Date.now()).toISOString()+"|program|"+program);
};
module.exports.write = sendClients;
module.exports.ProgramID = setID;