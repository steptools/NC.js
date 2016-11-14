'use strict';
let file = require('./file');
let fs = require('fs');
let _ = require('lodash');
let ws = 0;
let step = 0;
let ms = file.ms;
let wsteps = [];
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
}

//wsnum is UUID if type is static
let writer = (type,json,wsnum,stepnum)=>{
  let fname = '';
  if(type==='static') {
    fname = process.cwd()+'/cache/static/'+wsnum+'.json';
  } else {
    fname = process.cwd() + '/cache/' + wsnum + '/' + stepnum + '.' + type + '.json';
  }
  return exists(fname)
    .then((r)=>{
      if(r) {
        console.log("%s exists", fname);//If the file exists, fast fail.
        return;
      } else {
        fs.writeFile(fname, json);
      }
    })
};
let reader = (type,wsnum,stepnum)=> {
  let fname = '';
  if(type==='static'){ //wsnum is UUID if type is static
    fname = process.cwd()+'/cache/static/'+wsnum+'.json';
  } else {
    fname = process.cwd()+'/cache/'+wsnum+'/'+stepnum+'.'+type+'.json';
  }
  return fread(fname);
};
let popStatic = (key)=>{
  let state = JSON.parse(key);
  _.forEach(state.geom,(obj)=>{
    if((obj.hasOwnProperty('shell'))){
      ms.GetGeometryJSON(obj.id,'MESH')
        .then((j)=>{
          writer('static',j,obj.id)
        });
    } else if((obj.hasOwnProperty('polyline'))){
      ms.GetGeometryJSON(obj.id,'POLYLINE')
        .then((j)=>{
          writer('static',j,obj.id)
        });
    }
  });
};
let _init = ()=> {
  let cachify = (NextWS)=>{
    let pmise = {};
    let next = false;
    if(NextWS) {
      pmise = ms.GetWSID()
        .then((id)=> {
          console.log("WS ID: %d",id);
          ws = id;
          step = 0;
          return exists(process.cwd()+'/cache/'+ws);
        }).then((r)=>{
          if(!r) fs.mkdir(process.cwd()+'/cache/'+ws);
          return ms.GetKeyStateJSON()
            .then((j)=>{ popStatic(j);});
        });
    } else {
      pmise = Promise.resolve(0);
    }
    pmise.then(()=>{
      return exists(process.cwd() + '/cache/' + ws + '/' + step + '.dynamic.json');
    }).then((r)=>{
      if(r) //file exists, advance and don't worry.
        return ms.AdvanceState();
      else //files don't exist, get the JSONs and save em
        return Promise.all([
            ms.GetKeyStateJSON(),
            ms.GetDeltaStateJSON(),
            ms.GetDeltaGeometryJSON(Number(-1)),
            ms.GetCurrentSpindleSpeed(),
            ms.GetCurrentFeedrate()
          ])
          .then((jsons)=>{
            let i=0;
            let fnames = ['key','delta','dynamic','spindle','feed'];
            _.forEach(jsons,(j)=>{
              writer(fnames[i++],j,ws,step);
            });
            return ms.AdvanceState();
          });
    }).then((rtn)=>{
      if(rtn>0) {
        next = true;
        return ms.NextWS();
      }
      else step++;
      return Number(-1);
    }).then((id)=>{
      if(id === firstws) return 0;
      return cachify(next);
    });
  };
  console.log('here');
  exists(process.cwd()+'/cache/').then((r)=>{
    if(!r) fs.mkdir(process.cwd()+'/cache/');
    return exists(process.cwd()+'/cache/static');
  }).then((r)=>{
    if(!r) fs.mkdir(process.cwd()+'/cache/static');
    return cachify(true);
  });
};
let _dynamicState = ()=>{
  return reader('dynamic',wsteps[ws],step);
};
let _geometry = (id)=>{
  return reader('static',id);
}
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
      return 0;
  }).catch((err)=>{
    if(err.code==='ENOENT') {
      console.log('should switch');
      return 1;
    }
  });
};
let _nextWs = ()=>{
  step=0;
  ws++;
  if(ws>=wsteps.length) ws = 0;
  return Promise.resolve();
};
let _prevWs = ()=>{
  step=0;
  ws--;
  if(ws<0) ws = wsteps.length-1;
  return Promise.resolve();
};

//TODO: This should be made safer.
let _goToWs = (wsid)=>{ws = _.findIndex(wsteps,(id)=>{return id ===wsid;});console.log(ws); step=0;return Promise.resolve(0);};
let _getID = ()=>{return Promise.resolve(wsteps[ws]);};
let _getlastID = ()=>{
  if(ws-1<0)
    return Promise.resolve(wsteps[wsteps.length-1]);
  return Promise.resolve(wsteps[ws-1]);
};
let _getnextID = ()=>{
  if(ws+1>=wsteps.length)
    return Promise.resolve(wsteps[0]);
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
module.exports.NextWS = _nextWs;
module.exports.PrevWS = _prevWs;
module.exports.GoToWS = _goToWs;
module.exports.GetWSID = _getID;
module.exports.GetPrevWSID = _getlastID;
module.exports.GetNextWSID = _getnextID;
