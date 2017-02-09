'use strict';
let net = require('net');
let server = net.createServer((socket)=>{
});
let ports = [];
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
    ports.push(socket);
});

let sendClients = (msg)=>{
    ports.forEach((client)=>{
        client.write(msg);
    });
};

module.exports.write = sendClients;