var request = require('request');

// TODO define in configuration file
var stepServerURL = "http://127.0.0.1";
var stepServerPort = 8081;

function endpoint(name){
  return stepServerURL + ":" + stepServerPort + name;
}

module.exports = function(app, cb){
  app.ioServer.on('connection', function(socket){
    console.log("New Socket Connection");

    function reqProjects(){
      request(endpoint("/projects"), function(err, res, body){
        if (!err && res.statusCode == 200){
          socket.emit('projects', JSON.parse(body));
        }else{
          console.error(err);
        }
      });
      return "";
    }

    function reqModeltree(id){
      request(endpoint("/projects/" + id + "/plan"), function(err, res, body){
        if (!err && res.statusCode == 200){
          socket.emit('modeltree', JSON.parse(body));
        }else{
          console.error(err);
        }
      });
    }


    socket.on('req:projects', reqProjects);
    socket.on('req:modeltree', reqModeltree);

    socket.on('disconnect', function(){
      console.log("Disconnected")
    });
  });
  cb();
};
