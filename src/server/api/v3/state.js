'use strict';
var file = require('./file');
var step = require('./step');
var find = file.find;

var app;
var loopTimer;
var loopStates = {};
let playbackSpeed = 100;
let path = find.GetProjectName();

/****************************** Helper Functions ******************************/

function update(val) {
  app.ioServer.emit('nc:state', val);
}

function updateSpeed(speed) {
  app.ioServer.emit('nc:speed', speed);
}

function getDelta(ms, key, cb) {
  var response = '';
  if (key) {
    response = ms.GetKeystateJSON();
  } else {
    response = ms.GetDeltaJSON();
  }
  cb(response);
}

function getNext(ms, cb) {
  ms.NextWS();
  cb();
}

function getPrev(ms, cb) {
  ms.PrevWS();
  cb();
}

function getToWS(wsId, ms, cb) {
  ms.GoToWS(wsId);
  cb();
}

function loop(ms, key) {
  if (loopStates[path] === true) {
    //app.logger.debug('Loop step ' + path);
    let rc = ms.AdvanceState();
    if (rc === 0) {  // OK
      //app.logger.debug('OK...');
      getDelta(ms, key, function(b) {
        app.ioServer.emit('nc:delta', JSON.parse(b));
        if (playbackSpeed > 0) {
          if (loopTimer !== undefined) {
            clearTimeout(loopTimer);
          }
          loopTimer = setTimeout(() => loop(ms, false), 50/(playbackSpeed/200));
        } else {
          // app.logger.debug('playback speed is zero, no timeout set');
        }
      });
    } else if (rc === 1) {   // SWITCH
      // app.logger.debug('SWITCH...');
      let old = _getWorkingstep();
      getNext(ms, function() {
        loop(ms, true);
      });
      let setup = _sameSetup(_getWorkingstep(),old);
      if (!setup) {
        loopStates[path] = false;
        update('pause');
        loop(ms,false);
      }
      getDelta(ms, false, function(b) {
        app.ioServer.emit('nc:delta', JSON.parse(b));
        if (playbackSpeed > 0) {
          if (loopTimer !== undefined) {
            clearTimeout(loopTimer);
          }
          loopTimer = setTimeout(() => loop(ms, false), 50/(playbackSpeed/200));
        } else {
          // app.logger.debug('playback speed is zero, no timeout set');
        }
      });
    }
  }
}

function _getWorkingstep() {
  var ms = file.ms;
  let keyjson = JSON.parse(ms.GetKeystateJSON());
  return keyjson.workingstep;
}

function _sameSetup(newid, oldid) {
  return (step.getSetupFromId(newid) === step.getSetupFromId(oldid));
}

/***************************** Endpoint Functions *****************************/

function _loopInit(req, res) {
  // app.logger.debug('loopstate is ' + req.params.loopstate);
  if (req.params.loopstate === undefined) {
    if (loopStates[path] === true) {
      res
        .status(200)
        .send(JSON.stringify({
          'state': 'play',
          'speed': playbackSpeed,
        }));
    } else {
      res
        .status(200)
        .send( JSON.stringify({
          'state': 'pause',
          'speed': playbackSpeed,
        }));
    }
  } else {
    let loopstate = req.params.loopstate;
    var ms = file.ms;
    if (typeof loopStates[path]  === 'undefined') {
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
        res.status(200).send('OK');
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
        res.status(200).send('OK');
        break;
      default:
        if (isNaN(parseFloat) || !isFinite(loopstate)) {
          break;
        }

        let newSpeed = Number(loopstate);
        if (Number(playbackSpeed) !== newSpeed) {
          playbackSpeed = newSpeed;
          // app.logger.debug('Changing speed to ' + newSpeed);
        }

        if (loopStates[path] === true) {
          loop(ms, false);
          res
            .status(200)
            .send(JSON.stringify({
              'state': 'play',
              'speed': playbackSpeed,
            }));
        } else {
          res
            .status(200)
            .send(JSON.stringify({
              'state': 'pause',
              'speed': playbackSpeed,
            }));
        }
        updateSpeed(playbackSpeed);
    }
  }
}

function _wsInit(req, res) {
  if (!req.params.command) {
    return;
  }
  let command = req.params.command;
  let ms = file.ms;
  if (typeof loopStates[path] === 'undefined') {
    loopStates[path] = false;
  }
  let temp;
  switch (command) {
    case 'next':
      temp = loopStates[path];
      loopStates[path] = true;
      if (temp) {
        getNext(ms, () => loop(ms, true));
      } else {
        loop(ms, false);
        getNext(ms, () => loop(ms, true));
        loopStates[path] = false;
        update('pause');
      }
      res.status(200).send('OK');
      break;
    case 'prev':
      temp = loopStates[path];
      loopStates[path] = true;
      if (temp) {
        getPrev(ms, () => loop(ms, true));
      } else {
        loop(ms,false);
        getPrev(ms, () => loop(ms, true));
        loopStates[path] = false;
        update('pause');
      }
      res.status(200).send('OK');
      break;
    default:
      if (isNaN(parseFloat(command)) || !isFinite(command)) {
        break;
      }

      let ws = Number(command);
      temp = loopStates[path];
      loopStates[path] = true;
      if (temp) {
        getToWS(ws, ms, () => loop(ms, true));
        loopStates[path] = false;
        update('pause');
      } else {
        loop(ms,false);
        getToWS(ws, ms, () => loop(ms, true));
        loopStates[path] = false;
        update('pause');
      }
      res.status(200).send('OK');
  }

  getDelta(ms, false, function(b) {
    app.ioServer.emit('nc:delta', JSON.parse(b));
    if (playbackSpeed > 0) {
      if (loopTimer !== undefined) {
        clearTimeout(loopTimer);
      }
      loopTimer = setTimeout(() => loop(ms, false), 50/(playbackSpeed/200));
    }
  });
}

function _getKeyState(req, res) {
  let ms = file.ms;
  if (ms === undefined) {
    res.status(404).send('Machine state could not be found');
    return;
  }
  res.status(200).send(ms.GetKeystateJSON());
};

function _getDeltaState(req, res) {
  let ms = file.ms;
  if (ms === undefined) {
    res.status(404).send('Machine state could not be found');
    return;
  }
  res.status(200).send(ms.GetDeltaJSON());
};

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
