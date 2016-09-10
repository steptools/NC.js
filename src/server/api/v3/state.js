'use strict';
var file = require('./file');
var step = require('./step');
var find = file.find;
var app;
var loopTimer;
var loopStates = {};
let playbackSpeed = 100;
let spindleSpeed;
let feedRate;
let path = find.GetProjectName();
let changed=false;

/****************************** Helper Functions ******************************/

function update(val) {
  app.ioServer.emit('nc:state', val);
}

function updateSpeed(speed) {
  app.ioServer.emit('nc:speed', speed);
}

function getDelta(ms, key) {
  if (key) {
    return ms.GetKeyStateJSON();
  } else {
    return ms.GetDeltaStateJSON();
  }
}

function getNext(ms) {
  return ms.NextWS();
}

function getPrev(ms) {
  return ms.PrevWS();
}

function getToWS(wsId, ms) {
  return ms.GoToWS(wsId);
}

function loop(ms, key) {
  if (loopStates[path] === true) {
    if(changed)
    {
      changed=false;
      getNext(ms)
        .then(()=>{
          loop(ms, true,spindleSpeed,feedRate);
        });
    }
    //spindle speed and feedrate
    ms.GetCurrentSpindleSpeed().then((spindleSpeedNew)=> {
      spindleSpeedNew = Number(spindleSpeedNew);
      ms.GetCurrentFeedrate().then((feedRateNew)=> {
        feedRateNew = Number(feedRateNew);
        if (spindleSpeed !== spindleSpeedNew) {
          spindleSpeed = spindleSpeedNew;
          app.ioServer.emit('nc:spindle', spindleSpeed);
        }
        if (feedRate !== feedRateNew) {
          feedRate = feedRateNew;
          app.ioServer.emit('nc:feed', feedRate);
        }
        //get the delta
        getDelta(ms, key)
          .then((b)=> {
            app.ioServer.emit('nc:delta', JSON.parse(b));
            //change the working step
            ms.AdvanceState()
              .then((rc)=>{
                if (rc === 1) {
                  ms.GetWSID().then((wsid)=>{ms.GetNextWSID().then((nextwsid)=>{
                    let setup = sameSetup(wsid,nextwsid);
                    if (!setup) {
                      loopStates[path] = false;
                      update('pause');
                      changed = true;
                      if (playbackSpeed > 0) {
                        if (loopTimer !== undefined) {
                          clearTimeout(loopTimer);
                        }
                        loopTimer = setTimeout(() => loop(ms, false), 50 / (playbackSpeed / 200));
                      }
                    }
                    else {
                      getNext(ms)
                        .then(()=> {
                          loop(ms, true);
                        });
                    }
                  });});
                }
                else {
                  if (playbackSpeed > 0) {
                    if (loopTimer !== undefined) {
                      clearTimeout(loopTimer);
                    }
                    loopTimer = setTimeout(() => loop(ms, false), 50 / (playbackSpeed / 200));
                  }
                }
              });
          });
      });
    });
  }
}

function sameSetup(newid, oldid) {
  return (step.getSetupFromId(newid) === step.getSetupFromId(oldid)); //Finds the higher level container of the current workingstep
}

function handleWSInit(command, res) {
  let temp = loopStates[path];
  loopStates[path] = true;
  /*if (!temp) {
    loop(file.ms, false);
  }*/
  switch (command) {
    case 'next':
      if (temp) {
        if(!changed)
        {
          getNext(file.ms, function() {
            loop(file.ms, true);
          });
        }
        else loop(file.ms, true);
        
      } else {
        if(!changed)
        {
          getNext(file.ms, function() {
            loop(file.ms, true);
          });
        }
        else loop(file.ms, true);
        loopStates[path] = false;
        update('pause');
      }
      res.sendStatus(200);
      break;
    case 'prev':
      if (temp) {
        if(!changed)
        {
          getPrev(file.ms, function() {
            loop(file.ms, true);
          });
        }
        else
        {
          getPrev(file.ms, function() {
            loop(file.ms, true);
          });
          getPrev(file.ms, function() {
            loop(file.ms, true);
          });
        } 
      } else {
        if(!changed)
        {
          getPrev(file.ms, function() {
            loop(file.ms, true);
          });
        }
        else
        {
          getPrev(file.ms, function() {
            loop(file.ms, true);
          });
          getPrev(file.ms, function() {
            loop(file.ms, true);
          });
        }
        loopStates[path] = false;
        update('pause');
      }
      res.sendStatus(200);
      break;
    default:
      if (isNaN(parseFloat(command))
        || !isFinite(command)) {
        break;
      }
      let ws = Number(command);
      getToWS(ws, file.ms, function() {
        loop(file.ms, true);
      });
      loopStates[path] = false;
      update('pause');
      res.sendStatus(200);
  }
}

/***************************** Endpoint Functions *****************************/

function _loopInit(req, res) {
  // app.logger.debug('loopstate is ' + req.params.loopstate);
  var ms = file.ms;
  //console.log(req);
  ms.GetCurrentSpindleSpeed()
    .then((initialspindleSpeed)=>{
      ms.GetCurrentFeedrate().then((initialfeedRate)=>{
        if (req.params.loopstate === undefined) {
          spindleSpeed = initialspindleSpeed;
          feedRate = initialfeedRate;
          if (loopStates[path] === true) {
            res.status(200).send({
              'state': 'play',
              'speed': playbackSpeed,
              'spindle': spindleSpeed,
              'feed': feedRate,
            });
          } else {
            res.status(200).send({
              'state': 'pause',
              'speed': playbackSpeed,
              'spindle': spindleSpeed,
              'feed': feedRate,
            });
          }
        } else {
          let loopstate = req.params.loopstate;
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
              res.sendStatus(200);
              update('play');
              loop(ms, false);
              break;
            case 'stop':
              if (loopStates[path] === false) {
                res.status(200).send('Already stopped');
                return;
              }
              loopStates[path] = false;
              update('pause');
              res.sendStatus(200);
              break;
            default:
              if (isNaN(parseFloat(loopstate)) || !isFinite(loopstate)) {
                break;
              }
              let newSpeed = Number(loopstate);

              if (Number(playbackSpeed) !== newSpeed) {
                playbackSpeed = newSpeed;
                // app.logger.debug('Changing speed to ' + newSpeed);
              }

              if (loopStates[path] === true) {
                loop(ms, false);
                res.status(200).send({
                  'state': 'play',
                  'speed': playbackSpeed,
                });
              } else {
                res.status(200).send({
                  'state': 'pause',
                  'speed': playbackSpeed,
                });
              }
              updateSpeed(playbackSpeed);
          }
        }
      });
    });
}

var _wsInit = function(req, res) {
  let temp = false;
  if (!req.params.command) {
    return;
  }
  if (typeof loopStates[path] === 'undefined') {
    loopStates[path] = false;
  }

  handleWSInit(req.params.command, res);

  getDelta(file.ms, false)
    .then((b)=> {
      app.ioServer.emit('nc:delta', JSON.parse(b));
      if (playbackSpeed > 0) {
        if (loopTimer !== undefined) {
          clearTimeout(loopTimer);
        }
        loopTimer = setTimeout(function () {
          loop(file.ms, false);
        }, 50 / (playbackSpeed / 200));
      }
    });
};

function _getKeyState(req, res) {
  var ms = file.ms;
  if (ms === undefined) {
    res.status(404).send('Machine state could not be found');
    return;
  }
  getDelta(ms,true)
    .then((r)=>{
      res.status(200).send(r)
    });
}

function _getDeltaState(req, res) {
  var ms = file.ms;
  if (ms === undefined) {
    res.status(404).send('Machine state could not be found');
    return;
  }
  getDelta(ms,false)
    .then((r)=>{
      res.status(200).send(r)
    });
}

module.exports = function(globalApp, cb) {
  app = globalApp;
  app.router.get('/v3/nc/state/key', _getKeyState);
  app.router.get('/v3/nc/state/delta', _getDeltaState);
  app.router.get('/v3/nc/state/loop/:loopstate', _loopInit);
  app.router.get('/v3/nc/state/loop/', _loopInit);
  app.router.get('/v3/nc/state/ws/:command', _wsInit);

  if (cb) {
    cb();
  }
};
