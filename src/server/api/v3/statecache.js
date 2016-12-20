'use strict';
let file = require('./file');
let fs = require('fs');
let _ = require('lodash');
let ws = 0;
let step = 0;
let ms = file.ms;
let wsteps = [];
let dir = process.cwd()+"/"+file.project +"cache/" ;
let _load = ()=>{
  return new Promise((resolve)=> {
    let b = ()=>
    {
      ms.GetWSID().then((id)=> {
        if (id === wsteps[0]) {
          ws = 0;
          resolve();
        }
        else {
          wsteps.push(id);
          ms.NextWS().then(b);
        }
      });
    };
    b();
  });
};
let exists = (path)=>{
  return new Promise((resolve,reject)=>{
    fs.access(path,(err)=> {
      if (err && err.code === 'ENOENT') {
        resolve(false);
      }else if(err){
        reject(err);
      }else {
        resolve(true);
      }
    });
  });
};
let fread = (path)=>{
  return new Promise((resolve,reject)=>{
    fs.readFile(path,'utf8',(err,data)=>{
      if(err){
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

let promisewriteFile = (fname,data)=>{
  return new Promise((resolve,reject)=>{
    fs.writeFile(fname,data,(err)=>{
      if(err) reject(err);
      else resolve();
    });
  });
};
//wsnum is UUID if type is static
let writer = (type,json,wsnum,stepnum)=>{
  let fname = '';
  if(type==='static') {
    fname = dir+'static/'+wsnum+'.json';
  } else {
    fname = dir + wsnum + '/' + stepnum + '.' + type + '.json';
  }
  return exists(fname)
    .then((r)=>{
      if(r) {
        console.log("%s exists", fname);//If the file exists, fast fail.
        return Promise.resolve();
      } else {
        return promisewriteFile(fname,json);
      }
    });
};
let reader = (type,wsnum,stepnum)=> {
  let fname = '';
  if(type==='static'){ //wsnum is UUID if type is static
    fname = dir + 'static/'+wsnum+'.json';
  } else {
    fname = dir+wsnum+'/'+stepnum+'.'+type+'.json';
  }
  return fread(fname);
};
let popStatic = (key)=>{
  let state = JSON.parse(key);
  _.forEach(state.geom,(obj)=>{
    if((obj.hasOwnProperty('shell'))){
      ms.GetGeometryJSON(obj.id,'MESH')
        .then((j)=>{
          writer('static',j,obj.id).then(()=>{j=null;});
        });
    } else if((obj.hasOwnProperty('polyline'))){
      ms.GetGeometryJSON(obj.id,'POLYLINE')
        .then((j)=>{
          writer('static',j,obj.id).then(()=>{j=null;});
        });
    }
  });
};
let _init = ()=> {
  let cachify = (NextWS)=>{
    let pmise = {};
    let next = false;
    let id = -1;
    if(NextWS) {
      pmise = _getID()
        .then((wsid)=> {
          id = wsid;
          return ms.GoToWS(id);
        }).then(()=>{
          console.log("WS ID: %d",id);
          return Promise.all([exists(dir+id),Promise.resolve(id)]);
        }).then((r)=>{
          if(!r[0]) fs.mkdir(dir+r[1]);
          return ms.GetKeyStateJSON()
            .then((j)=>{ popStatic(j);});
        });
    } else {
      pmise = Promise.resolve(0);
    }
    pmise.then(()=>{
      return exists(dir + wsteps[ws] + '/' + step + '.dynamic.json');
    }).then((r)=>{
      if(r) //file exists, advance and don't worry.
        return ms.AdvanceState();
      else //files don't exist, get the JSONs and save em
        return Promise.all([
            ms.GetKeyStateJSON(),
            ms.GetDeltaStateJSON(),
            ms.GetDynamicGeometryJSON(Number(-1)),
            ms.GetCurrentSpindleSpeed(),
            ms.GetCurrentFeedrate()
          ])
          .then((jsons)=>{
            let i=0;
            let fnames = ['key','delta','dynamic','spindle','feed'];
            _.forEach(jsons,(j)=>{
              writer(fnames[i++],j,wsteps[ws],step).then(()=>{j=null;});
            });
            return ms.AdvanceState();
          });
    }).then((rtn)=>{
      if(rtn.value>0) {
        next = true;
        return _nextWs();
      }
      else step++;
      return Number(-1);
    }).then((id)=>{
      if(id === wsteps[0]) return 0;
      return cachify(next);
    });
  };
  exists(dir).then((r)=>{
    if(!r) fs.mkdir(dir);
    return exists(dir+'static');
  }).then((r)=>{
    if(!r) fs.mkdir(dir+'static');
    return cachify(true);
  });
};
let _dynamicState = ()=>{
  return reader('dynamic',wsteps[ws],step);
};
let _geometry = (id)=>{
  return reader('static',id);
};
let _deltaState = ()=>{
  return reader('delta',wsteps[ws],step);
};
let _keyState = ()=>{
  return reader('key',wsteps[ws],step);
};
let _spindleSpeed = ()=>{
  return reader('spindle',wsteps[ws],step);
};
let _feedRate = ()=>{
  return reader('feed',wsteps[ws],step);
};

let _advanceState = ()=>{
  step++;
  return _keyState()
    .then(()=>{
      return {'value':0,'more':false};
  }).catch((err)=>{
    if(err.code==='ENOENT') {
      step--;
      return {'value':1,'more':false};
    }
  });
};
let _nextWs = ()=>{
  step=0;
  ws++;
  let rtn = -1;
  if(ws>=wsteps.length) {
    ws--;
  } else {
    rtn = wsteps[ws];
  }
  return Promise.resolve(rtn);
};
let _prevWs = ()=>{
  step=0;
  ws--;
  let rtn = -1;
  if(ws<0) {
    ws=0;
  } else {
    rtn = wsteps[ws];
  }
  return Promise.resolve(rtn);
};
let _firstWs = ()=>{
  ws=0;
  return Promise.resolve(wsteps[ws]);
};
let _lastWs = ()=>{
  ws = wsteps.length-1;
  return Promise.resolve(wsteps[ws]);
};

//TODO: This should be made safer.
let _goToWs = (wsid)=>{ws = _.findIndex(wsteps,(id)=>{return id ===wsid;});console.log(ws); step=0;return Promise.resolve(0);};
let _getID = ()=>{return Promise.resolve(wsteps[ws]);};
let _getlastID = ()=>{
  if(ws-1<0)
    return Promise.resolve(-1);
  return Promise.resolve(wsteps[ws-1]);
};
let _getnextID = ()=>{
  if(ws+1>=wsteps.length)
    return Promise.resolve(-1);
  return Promise.resolve(wsteps[ws+1]);
};

module.exports.Initialize = _load;
module.exports.CreateCache = _init;
module.exports.GetDynamicGeometryJSON = _dynamicState;
module.exports.GetGeometryJSON = _geometry;
module.exports.GetDeltaStateJSON = _deltaState;
module.exports.GetKeyStateJSON = _keyState;
module.exports.GetCurrentSpindleSpeed = _spindleSpeed;
module.exports.GetCurrentFeedrate = _feedRate;
module.exports.AdvanceState = _advanceState;
module.exports.FirstWS = _firstWs;
module.exports.LastWS = _lastWs;
module.exports.NextWS = _nextWs;
module.exports.PrevWS = _prevWs;
module.exports.GoToWS = _goToWs;
module.exports.GetWSID = _getID;
module.exports.GetPrevWSID = _getlastID;
module.exports.GetNextWSID = _getnextID;
