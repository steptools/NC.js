//Script for making a full set of as-is/to-be geom for the wsteps in a file.
"use strict";

let file = require("../src/server/api/v3/file.js");
let program = require('commander');
let path = require('path');
program
    .version('0.0.1')
    .option('-f, --filename <name>','File to augment')
    .parse(process.argv);

file.init(program.filename,'','./asisadddumps/');
let WSCache = [];
let initWSCache = (id) => {
    return file.ms.GetWSID()
        .then((id) => {
            if (id === WSCache[0]) {
                return true;
            }
            WSCache.push(id);
            return file.ms.NextWS();
        }).then((done) => {
            if (done === true) {
                return;
            }
            return initWSCache();
        });
};
let cur=0;
let loadAsIs = ()=>{
    return file.ms.AdvanceStateByT(1000)
    .then((state)=>{
        if(state.value===0) return loadAsIs();
        cur++;
        if(!WSCache[cur]) return;
        let asisname = WSCache[cur]+'asis'+file.find.GetExecutableName(WSCache[cur])+'.stp';
        console.log('writing %s (%d/%d)',asisname,cur,WSCache.length);
        return file.ms.WriteDynamicGeometrySTEP(asisname).then(()=>{
            file.apt.ExecutableWorkpieceAsIs(WSCache[cur],asisname);
        });
    }).then(()=>{
        return file.ms.NextWS();
    }).then(()=>{
        return file.ms.GetWSID();
    }).then((id)=>{
        if(id===WSCache[0]||id===WSCache[WSCache.length]||!WSCache[cur]) return;
        console.log('starting %d',id);
        return loadAsIs();
        //return file.apt.
    });
};
initWSCache(-1).then(()=>{
    console.log(WSCache);
    loadAsIs().then(()=>{
        let outname = path.parse(program.filename).name+'_with_asis.stpnc';
        console.log("saving to %s",outname);

        file.apt.SaveAsModules(outname);
        process.exit();
    });
});
//file.ms.AdvanceStateByT(1000000000); //Arbitrarily large T

//Make sure event loop doesn't die.
let a = ()=>{setTimeout(a,100);};
a();
