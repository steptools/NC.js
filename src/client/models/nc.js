/* 
 * Copyright (c) 2016-2017 by STEP Tools Inc. 
 * G. Hemingway Copyright @2014
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

/* 
 * Context for the overall CAD assembly
 */
"use strict";


import Assembly from './assembly';
import Annotation          from './annotation';
import DataLoader from './data_loader';
import Shell from './shell';
import DynamicShell from './dynamicshell';
import {saveSTL} from './save_STL';
/*************************************************************************/
//HACK: FIXME.
let dynqueuegetting = false;
let dynqueuenext = false;
let dynqueuecur = -1;
let dynqueuecb = ()=>{};

export default class NC extends THREE.EventDispatcher {
  constructor(project, workingstep, timeIn, loader) {
    super();
    this.app = loader._app;
    this.sequence=0;
    this.MESHMATERIAL = new THREE.ShaderMaterial(new THREE.VelvetyShader());
    this.project = project;
    this._workingstep = workingstep;
    this._timeIn = timeIn;
    this._loader = loader;
    this._objectCache = {};
    this._curObjects = {};
    this.type = 'nc';
    this.raycaster = new THREE.Raycaster();
    this._object3D = new THREE.Object3D();
    this._overlay3D = new THREE.Object3D();
    this._annotation3D = new THREE.Object3D();
    this.state = {
      selected:       false,
      highlighted:    false,
      visible:        true,
      opacity:        1.0,
      explodeDistance: 0,
      collapsed:      false,
      usagevis: {
        asis:       false,
        tobe:       false,
        machine:    true,
        cutter:     true,
        inprocess:  true,
        toolpath:   true,
        fixture:    true
      }
    };
    this.bindFunctions();
    this.app.actionManager.on('STLDL',this.save);
  }

  bindFunctions(){
    this.vis = this.vis.bind(this);
    this.getVis = this.getVis.bind(this);
    this.save = this.save.bind(this);
    this.getCurrentObjects = this.getCurrentObjects.bind(this);
    this.applyDelta = this.applyDelta.bind(this);
    this.applyKeyState = this.applyKeyState.bind(this);
    this.applyDeltaState = this.applyDeltaState.bind(this);
    this.handleDynamicGeom = this.handleDynamicGeom.bind(this);
  }
  save(arg){
    let changes = {};
    switch (arg) {
      case 'asis':
      changes = _.filter(this._curObjects,(obj)=>{
        return obj.usage==='asis';
      });
      break;
      case 'tobe':
      changes = _.filter(this._curObjects,(obj)=>{
        return obj.usage==='tobe';
      });
      break;
      case 'machine':
      changes = _.filter(this._curObjects,(obj)=>{
        return obj.usage==='machine';
      });
      break;
      case 'cutter':
      changes = _.filter(this._curObjects,(obj)=>{
        return obj.usage==='cutter';
      });
      break;
      case 'inprocess':
      changes = _.filter(this._curObjects,(obj)=>{
        return obj.usage==='inprocess';
      });
      break;
      default:
      break;
    }
    let savegeoms = _.map(changes,(c)=>{
      if(c instanceof DynamicShell) {
        return c.getGeometry().geometry;
      } else{
        let shapegeoms = c.getGeometry();
        return _.map(shapegeoms.children,(child)=>{return child.geometry});
      }
    });
    saveSTL(arg,_.flatten(savegeoms));
  }
  vis (arg) {
    let changes = {};
    switch (arg.usage) {
      case 'asis':
      changes = _.filter(this._curObjects,(obj)=>{
        return obj.usage==='asis';
      });
      this.state.usagevis.asis= !this.state.usagevis.asis;
      break;
      case 'tobe':
      changes = _.filter(this._curObjects,(obj)=>{
        return obj.usage==='tobe';
      });
      this.state.usagevis.tobe= !this.state.usagevis.tobe;
      break;
      case 'machine':
      changes = _.filter(this._curObjects,(obj)=>{
        return obj.usage==='machine';
      });
      this.state.usagevis.machine = !this.state.usagevis.machine;
      break;
      case 'cutter':
      changes = _.filter(this._curObjects,(obj)=>{
        return obj.usage==='cutter';
      });
      this.state.usagevis.cutter=!this.state.usagevis.cutter;
      break;
      case 'fixture':
      changes = _.filter(this._curObjects,(obj)=>{
        return obj.usage==='fixture';
      });
      this.state.usagevis.fixture=!this.state.usagevis.fixture;
      break;
      case 'inprocess':
      changes = _.filter(this._curObjects,(obj)=>{
        return obj.usage==='inprocess';
      });
      this.state.usagevis.inprocess = !this.state.usagevis.inprocess;
      break;
      case 'toolpath':
      changes = _.filter(this._curObjects,(obj)=>{
        return obj.usage==='toolpath';
      });
      this.state.usagevis.toolpath=!this.state.usagevis.toolpath;
      default:
      break;
    }
    if(arg.show){
    _.each(changes,(obj)=>{
      obj.show();
    });
    } else{
    _.each(changes,(obj)=>{
      obj.hide();
    });
    }
  }
  getVis(){
    return this.state.usagevis;
  }

  getObject3D(){
    return this._object3D;
  }

  getObjects(){
    return this._objects;
  }

  getCurrentObjects(){
    return this._curObjects;
  }
  getOverlay3D(){
    return this._overlay3D;
  }

  getAnnotation3D(){
    return this._annotation3D;
  }

  getBoundingBox() {
    this.boundingBox = new THREE.Box3();
    _.each(this._curObjects, (obj) => {
      this.boundingBox.union(obj.getBoundingBox());
    })
    return this.boundingBox.clone();
  }

  calcBoundingBox() {
    let bbxform = new THREE.Matrix4();
    bbxform.set(
    -1, 0, 0, 0,
    0, 0, 1, 0,
    0, 1, 0, 0,
    0, 0, 0, 1
    );
    this._overlay3D.remove(this.bbox);
    let bounds = this.getBoundingBox();

    this.bbox = Assembly.buildBoundingBox(bounds);
    this.bbox.applyMatrix(bbxform);
    if (this.bbox && this.state.selected) {
      this._overlay3D.add(this.bbox);
    }
  }

  clearHighlights() {
    this.dispatchEvent({type: '_clearHighlights'});
  }

  hideAllBoundingBoxes() {
    this.dispatchEvent({type: '_hideBounding'});
  }

  getNamedParent() {
    return this;
  }

  select(camera, mouseX, mouseY) {
    let mouse = new THREE.Vector2();
    mouse.x = (mouseX) * 2 - 1;
    mouse.y = -(mouseY) * 2 + 1;
    this.raycaster.setFromCamera(mouse, camera);

    let objs = _.map(_.values(this._objects), (obj) => obj.object3D);
    let intersections = this.raycaster.intersectObjects(objs, true);
    // Did we hit anything?
    if (intersections.length < 1) {
      return undefined;
    }
    let hit = undefined;
    for (let i = 0; i < intersections.length; i++) {
      if (!intersections[i].object.visible) {
        continue;
      }
      if (!hit || intersections[i].distance < hit.distance) {
        hit = intersections[i];
      }
    }
    return hit;
  }

  dynqueue(cb) {
    if (dynqueuegetting){ //getting something already
      dynqueuenext = true;
      dynqueuecb = cb;
      return;
    }
    dynqueuegetting = true;
    let resolvequeue = (res)=>{
      dynqueuegetting = false;

      dynqueuecur = res.version;
      if (dynqueuenext === true) {
        dynqueuenext = false;
        this.dynqueue(dynqueuecb);
      } else {
        return;
      }
    };
    request.get('/v3/nc/geometry/delta/-1').timeout(10000)
    .then((res)=>{
      //let dyn = {'version':dynqueuecur};
      try {
        cb(res.body);
      } catch (e) {
        //TODO: Handle e?
        e;
      }
      return resolvequeue(res.body);
    }).catch(()=>{
      return resolvequeue({'version':dynqueuecur});
    });
  }

  parseDynamicFull(geom,obj,sequence,olddynshell) {
    let geometry = {};
    if(olddynshell){
      geometry = olddynshell;
      geometry.replaceGeometry(geom);
    } else{
      geometry = new DynamicShell(geom, this.app.cadManager, obj.id);
    }
    geometry.getGeometry().name = 'inprocess '+geom.version;
    geometry.addToScene(obj.bbox,obj.xform,sequence);
    geometry.usage="inprocess";
    geometry.version = geom.version;
    this._objectCache[obj.id] = geometry;
    this._curObjects[obj.id] = geometry;
    this.state.usagevis[obj.usage] ? geometry.show() : geometry.hide();
    return true;
  }

  parseDynamicUpdate(geom,obj) {
      if (!geom.hasOwnProperty('prev_version')) {
        return this.parseDynamicFull(geom,obj);
      }
      if (geom.version <= obj.version ||
        obj.baseVersion !== geom.base_version ||
        obj.version !== geom.prev_version) {
        return;
      }
      let geometry = makeGeometry(processDelta(geom, obj));
      // Remove all old geometry -- mesh's only
      obj.object3D.traverse(function (child) {
        if (child.type === 'Mesh') {
          obj.object3D.remove(child);
        }
      });
      // Create new modified geometry and add to obj
      let mesh = new THREE.Mesh(geometry, this.MESHMATERIAL);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = obj;
      obj.object3D.add(mesh);
      // Make sure to update the model geometry
      if (obj.model.getGeometry()) {
        obj.model.getGeometry().dispose();
      }
      obj.model.setGeometry(geometry);
      obj.version = geom.version;
    }

  handleDynamicGeom(geom,forceFull,sequence,cb,cbdata){
    if (!geom) {
      return cb(cbdata);
    }
    let existingobj = this._objectCache[geom.id];
    if (existingobj === undefined ) { //Need a full dynamic shell.
      //Setup the memory
      //let color = DataLoader.parseColor('BE17FF');
      //let boundingBox = DataLoader.parseBoundingBox(geom.bbox);
      //let transform =DataLoader.parseXform(geom.xform,true);
      //let shape = new Shape(geom.id,this,this,geom.size,color,boundingBox);
      //this.addModel(shell,geom.usage,'shell',geom.id,transform,boundingBox);
      //existingobj = this._objects[geom.id];

      this.dynqueue((fulldynamic)=>{
        this.parseDynamicFull(fulldynamic,geom,sequence);//existingobj);
        cb(cbdata);
      });
    } else if(forceFull){
      this.dynqueue((fulldynamic)=>{
        this.parseDynamicFull(fulldynamic,geom,sequence,existingobj);
        cb(cbdata);
      });

    } else { //Need an updated dynamic shell.
      if (existingobj.version !== geom.version) {
        //existingobj.removeFromScene();
        this.dynqueue((updateddynamic)=> {
          this.parseDynamicFull(updateddynamic, geom,sequence,existingobj);
          cb(cbdata);
        });
      } else {
        cb(cbdata);
      }
    }
    return true;
    // Don't know what kind of update this is
  }

  applyKeyState(state,forceDynamic){
    let sequence = this.sequence++;
    let dyn = _.find(state.geom,['usage','inprocess']);
    let ids = _.map(state.geom,(g)=>{return g.id;});
    //console.log("IDs: %j",ids);
    _.each(this._objectCache, (obj) => {
      if (!_.find(state.geom, (g) => { return (g.id === obj.id); })) {
        obj.removeFromScene(sequence);
        this._curObjects[obj.id] = {};
        delete this._curObjects[obj.id];
        //console.log("Removed "+obj.id);
      }
    });
    return new Promise((resolve)=>{
      this.handleDynamicGeom(dyn, forceDynamic,sequence, () => {
        let rtn = true;
        let loadingct = 0;
        _.each(state.geom, (geomref) => {
          if(geomref.usage === 'inprocess' || geomref.usage === 'removal') return;
          if(this._objectCache[geomref.id] !==undefined){
            if(this._curObjects[geomref.id] !==undefined){
              this._curObjects[geomref.id].repositionInScene(geomref.bbox,geomref.xform);
            } else{
            this._objectCache[geomref.id].addToScene(geomref.bbox,geomref.xform,sequence);
            this._curObjects[geomref.id] = this._objectCache[geomref.id];
            this._curObjects[geomref.id].usage = geomref.usage;
            this._curObjects[geomref.id].getGeometry().name = geomref.usage;
            }
            if(this.state.usagevis[geomref.usage]===true) {
              this._objectCache[geomref.id].show();
            } else {
              this._objectCache[geomref.id].hide();
            }
            return;
          } else {
            loadingct++;
            this._loader.addRequest({
              path:geomref.id,
              baseURL:'/v3/nc',
              type: 'geometry'
            },(ev)=>{
              this._objectCache[geomref.id] = ev;
              this._objectCache[geomref.id].addToScene(geomref.bbox, geomref.xform,sequence);
              this._curObjects[geomref.id] = ev;
              this._curObjects[geomref.id].getGeometry().name = geomref.usage;
              this._curObjects[geomref.id].usage = geomref.usage;
              if(this.state.usagevis[geomref.usage]===true){
                this._objectCache[geomref.id].show();
              } else {
                this._objectCache[geomref.id].hide();
              }
              loadingct--;
              if(loadingct === 0){
                resolve({ 'update': rtn, 'sequence': sequence });
              };
            });
          }
        })
        if(this._workingstep!==state.workingstep){
          this.app.actionManager.emit('change-workingstep', state.workingstep);
          this._workingstep = state.workingstep;
        }
        if(loadingct > 0){
          this._loader.runLoadQueue();
        } else {
          resolve({'update':rtn,'sequence':sequence});
        }
      });
  });
  }
  applyDeltaState(state){
    //Theoretically a delta state shouldn't wipe the existing display, 
    //However as of STEPNode@4 a delta state will always contain a full list of objects.
    //TODO: CHANGEME when optimization code is added.
    return this.applyKeyState(state);
  };
  
  applyDelta(delta,forceKey,forceDynamic) {
      //There are two types of 'State' that we get- KeyState or DeltaState.

      //If we get a KeyState, we need to re-render the scene.
      //If we get a DeltaState, we need to update the scene.
      //First we handle KeyState.
      if (forceKey || !delta.hasOwnProperty('prev')){
        //  let lineGeometries = event.annotation.getGeometry();
        return this.applyKeyState(delta,forceDynamic);
      } else {
        return this.applyDeltaState(delta);
      }
  }

  getSelected() {
    if (this.state.selected) {
      return [this];
    } else {
      return [];
    }
  }
  getID() {
    return this.id;
  }

  toggleSelection() {
    // On deselection
    if (this.state.selected) {
      // Hide the bounding box
      this._overlay3D.remove(this.bbox);
      // On selection
    } else {
      let bounds = this.getBoundingBox(false);
      if (!this.bbox && !bounds.isEmpty()) {
        this.bbox = Assembly.buildBoundingBox(bounds);
      }
      if (this.bbox) {
        // Add the BBox to our overlay object
        this._overlay3D.add(this.bbox);
      }
    }
    this.state.selected = !this.state.selected;
  }
}
