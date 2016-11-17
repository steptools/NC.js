'use strict';
let file = require('./file');
let step = require('./step');
let ms = {}; //module.exports defines it.
let _ = require('lodash');
let find = file.find;
let app;
let loopTimer = {};
let loopStates = {};
let playbackSpeed = 100;
let spindleSpeed;
let feedRate;
let path = find.GetProjectName();
let changed=false;
let setupFlag = false;

/****************************** Helper Functions ******************************/

function update(val) {
  app.ioServer.emit('nc:state', val);
}

function updateSpeed(speed) {
  app.ioServer.emit('nc:speed', speed);
}

function getDelta(key) {
  if (key===true) {
    return ms.GetKeyStateJSON();
  } else {
    return ms.GetDeltaStateJSON();
  }
}

function getNext() {
  changed=true;
  setupFlag =false;
  return ms.NextWS().then((r)=>{
    if(r==-1) {
      return ms.FirstWS();
    } else {
      return r;
    }
  });
}

function getPrev() {
  changed=true;
  setupFlag =false;
  return ms.PrevWS().then((r)=>{
    if(r==-1) {
      return ms.LastWS();
    } else {
      return r;
    }
  });
}

function getToWS(wsId) {
  changed=true;
  setupFlag =false;
  return ms.GoToWS(wsId);
}

function promiseTimeout(msec){
  return new Promise((resolve)=>{
    setTimeout(resolve,msec);
  });
}

let isTicking = false;
let movequeue = [];
function looptick(){
  if(movequeue.length > 0){
    let move = movequeue.shift();
    move().then(()=>{
     return getDelta(true);
    }).then((newState)=>{
      app.ioServer.emit('nc:delta', JSON.parse(newState))
    });
  } else if(loopStates[path]===true) {
    if(setupFlag===true){ //Somebody pushed play after it paused for a setup end
      movequeue.push(()=>{return getNext();});
      setupFlag =false;
    }else {
      loop(false);
    }
  }
  loopTimer = promiseTimeout(50/(playbackSpeed/200));
  return loopTimer.then(() => {loopTimer = {}; return looptick();});
}

function loop(key) {
  if(changed)
  {
    changed=false;
    key = true;
  }
  //spindle speed and feedrate
  Promise.all([
      ms.GetCurrentSpindleSpeed(),
      ms.GetCurrentFeedrate()
    ])
    .then((newspeedfeed)=> {
      let spindleSpeedNew = Number(newspeedfeed[0]);
      let feedRateNew = Number(newspeedfeed[1]);
      if (spindleSpeed !== spindleSpeedNew) {
        spindleSpeed = spindleSpeedNew;
        app.ioServer.emit('nc:spindle', spindleSpeed);
      }
      if (feedRate !== feedRateNew) {
        feedRate = feedRateNew;
        app.ioServer.emit('nc:feed', feedRate);
      }
      //get the delta
      return getDelta(key);
    })
    .then((newState)=> {
      app.ioServer.emit('nc:delta', JSON.parse(newState));
      //change the working step
      return ms.AdvanceState();
    })
    .then((shouldSwitch)=>{
      if (shouldSwitch === 1) {
        return Promise.all([
            ms.GetWSID(),
            ms.GetNextWSID()
          ])
          .then((wsids)=>{
            let keepSetup = false;
            if(!(wsids[1]===-1))
              keepSetup = sameSetup(wsids[0],wsids[1]);
            if (!keepSetup) { //Stop on setup changes.
              loopStates[path] = false;
              update('pause');
              setupFlag = true;
              return;
            }
            else {
              movequeue.push(()=>{return getNext();});
            }
          });
      }
    });
}

function sameSetup(newid, oldid) {
  return (step.getSetupFromId(newid) === step.getSetupFromId(oldid)); //Finds the higher level container of the current workingstep
}

function handleWSInit(command, res) {
  switch (command) {
    case 'next':
      movequeue.push(()=>{return getNext();});
      break;
    case 'prev':
      movequeue.push(()=>{return getPrev();});
      break;
    default:
      if (isNaN(parseFloat(command))
        || !isFinite(command)) {
        break;
      }
      let ws = Number(command);
      movequeue.push(()=>{return getToWS(ws);});
  }
  res.sendStatus(200);
}

/***************************** Endpoint Functions *****************************/

function _loopInit(req, res) {
  // app.logger.debug('loopstate is ' + req.params.loopstate);
  if(!isTicking){
    isTicking=true;
    looptick();
  }
  Promise.all([
    ms.GetCurrentSpindleSpeed(),
    ms.GetCurrentFeedrate()
  ])
    .then((initialspeedfeed)=>{
      let initialspindleSpeed = initialspeedfeed[0];
      let initialfeedRate = initialspeedfeed[1];
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
            //loop(ms, false);
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
              //loop(ms, false);
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
}

var _wsInit = function(req, res) {
  if (!req.params.command) {
    return;
  }
  if (typeof loopStates[path] === 'undefined') {
    loopStates[path] = false;
  }

  handleWSInit(req.params.command, res);

  getDelta(true)
    .then((b)=> {
      app.ioServer.emit('nc:delta', JSON.parse(b));
    });
};

function _getKeyState(req, res) {
  if (ms === undefined) {
    res.status(404).send('Machine state could not be found');
    return;
  }
  getDelta(true)
    .then((r)=>{
      res.status(200).send(JSON.parse(r));
    });
}

function _getDeltaState(req, res) {
  if (ms === undefined) {
    res.status(404).send('Machine state could not be found');
    return;
  }
  getDelta(false)
    .then((r)=>{
      res.status(200).send(JSON.parse(r));
    });
}

module.exports = function(globalApp, cb) {
  app = globalApp;
  app.router.get('/v3/nc/state/key', _getKeyState);
  app.router.get('/v3/nc/state/delta', _getDeltaState);
  app.router.get('/v3/nc/state/loop/:loopstate', _loopInit);
  app.router.get('/v3/nc/state/loop/', _loopInit);
  app.router.get('/v3/nc/state/ws/:command', _wsInit);
  if(app.config.noCache){
    ms = file.ms;
  }
  else {
    ms = require('./statecache');
    ms.Initialize();
  }
  if (cb) {
    cb();
  }
};
