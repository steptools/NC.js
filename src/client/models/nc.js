/* G. Hemingway Copyright @2014
 * Context for the overall CAD assembly
 */
"use strict";


import Assembly from './assembly';
import Annotation          from './annotation';
import DataLoader from './data_loader';
import Shell from './shell';
import {makeGeometry, processKeyframe, processDelta} from './nc_delta';
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
    saveSTL(arg,changes);
  }
  vis (arg) {
    let changes = {};
    switch (arg) {
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
    _.each(changes,(obj)=>{
      obj.toggleVisibility();
    });
  }
  getVis(){
    return this.state.usagevis;
  }
  addModel(model, usage, type, id, transform, bbox) {
    // console.log('Add Model(' + usage + '): ' + id);
    // Setup 3D object holder
    let obj = {
      model: model,
      usage: usage,
      type: type,
      id: id,
      rendered: true,
      object3D: new THREE.Object3D(),
      transform: (new THREE.Matrix4()).copy(transform),
      bbox: bbox,
      getID: ()=>obj.id,
      getNamedParent: ()=>obj,
      getBoundingBox: ()=>obj,
      toggleHighlight: ()=>{},
      toggleVisibility: ()=>{
        obj.object3D.visible = !obj.object3D.visible;
      },
      setInvisible: ()=>obj.object3D.visible = false,
      setVisible: ()=>obj.object3D.visible = true,
      toggleOpacity: ()=>{},
      toggleSelection: ()=>{},
      toggleCollapsed: ()=>{},
      explode: ()=>{}
    };
    obj.object3D.applyMatrix(obj.transform);
    obj.object3D.updateMatrixWorld();
    obj.overlay3D = obj.object3D.clone();
    obj.annotation3D = obj.object3D.clone();
    // Save the object
    this._objects[id] = obj;
    this._object3D.add(obj.object3D);
    this._overlay3D.add(obj.overlay3D);
    this._annotation3D.add(obj.annotation3D);
    if (type === 'shell') {
      model.addEventListener('shellEndLoad', (event) => {
        //This is where the shell gets sent when its loaded,
        //so that the full mesh can be added to the 3D objects
        let mesh = new THREE.Mesh(
          event.shell.getGeometry(),
          this.MESHMATERIAL,
          false
        );

        if (obj.bbox.isEmpty()) {
          obj.bbox = event.shell.getBoundingBox();
        }

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = obj;
        obj.object3D.add(mesh);
        obj.version = 0;
        this.state.usagevis[obj.usage] ? obj.setVisible() : obj.setInvisible();
      });
    } else if (type === 'polyline') {
      model.addEventListener('annotationEndLoad', (event) => {
        let lineGeometries = event.annotation.getGeometry();
        let material = new THREE.LineBasicMaterial({
          vertexColors: THREE.VertexColors,
          //color: 0xffffff,
          linewidth: 1
        });
        model._addedGeometry = [];
        for (let i = 0; i < lineGeometries.length; i++) {
          let lines = new THREE.Line(lineGeometries[i], material);
          lines.visible = true;
          obj.annotation3D.add(lines);
          model._addedGeometry.push(lines);
        }
      });
      model.addEventListener('annotationMakeVisible', ()=>{
        _.each(model._addedGeometry, (line)=>{
          obj.annotation3D.add(line);
        });
      });

      let removeAnno = () => {
        model.removeEventListener('annotationEndLoad', removeAnno);
        _.each(model._addedGeometry, (line)=>{
          obj.annotation3D.remove(line);
        });
      };

      model.addEventListener('annotationMakeNonVisible', ()=>{
        if (!model._addedGeometry || model._addedGeometry.length === 0) {
          model.addEventListener('annotationEndLoad', removeAnno);
        } else {
          removeAnno();
        }
      });
    }
  }

  updateObjectAllPositionQuaternion(obj,position,quaternion){
    obj.object3D.position.copy(position);
    obj.object3D.quaternion.copy(quaternion);
    obj.annotation3D.position.copy(position);
    obj.annotation3D.quaternion.copy(quaternion);
    obj.overlay3D.position.copy(position);
    obj.overlay3D.quaternion.copy(quaternion);
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
    return hit.object.userData;
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
      let dyn = JSON.parse(res.text);
      try {
        cb(dyn);
      } catch (e) {
        //TODO: Handle e?
        e;
      }
      return resolvequeue(dyn);
    }).catch(()=>{
      return resolvequeue({'version':dynqueuecur});
    });
  }

  parseDynamicFull(geom,obj) {
    let geometry = makeGeometry(processKeyframe(geom));
    // Remove all old geometry -- mesh's only
    obj.object3D.traverse(function(child) {
      if (child.type === 'Mesh') {
        obj.object3D.remove(child);
      }
    });
    // Add in new geometry
    let mesh = new THREE.Mesh(geometry, this.MESHMATERIAL);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = obj;
    obj.object3D.add(mesh);
    //Uncomment to add edge outlining
    //let geo = new THREE.EdgesGeometry( mesh.geometry);
    //let mat = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 2});
    //let wireframe = new THREE.LineSegments(geo,mat);
    //mesh.add(wireframe);
    // Make sure to update the model geometry
    if (obj.model.getGeometry()) {
      obj.model.getGeometry().dispose();
    }
    obj.model.setGeometry(geometry);
    obj.model.live = true;
    obj.version = geom.version;
    obj.baseVersion= geom.base_version;
    obj.precision = geom.precision;
    obj.id = geom.id;
    this.state.usagevis[obj.usage] ? obj.setVisible() : obj.setInvisible();
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

  handleDynamicGeom(geom,forceFull,cb,cbdata){
    if (!geom) {
      return cb(cbdata);
    }
    let existingobj = this._objects[geom.id];
      //Wipe out any old in process geoms.
    let removelist = [];
    _.each(this._objects, (o,key) => {
      if (o.usage !== 'inprocess' || key === geom.id) return;
      o.object3D.traverse((child) => {
        if (child.type === 'Mesh') {
          o.object3D.remove(child);
        }
        o.rendered = false;
        o.model.live = false;
        o.visible = false;
        o.object3D.visible = false;
      });
      removelist.push(o.key);
    });
    _.each(removelist, (o)=>{
      delete this._objects[o];
    });
    if (existingobj === undefined ) { //Need a full dynamic shell.
      //Setup the memory
      let color = DataLoader.parseColor('BE17FF');
      let boundingBox = DataLoader.parseBoundingBox(geom.bbox);
      let transform =DataLoader.parseXform(geom.xform,true);
      let shell = new Shell(geom.id,this,this,geom.size,color,boundingBox);
      this.addModel(shell,geom.usage,'shell',geom.id,transform,boundingBox);
      existingobj = this._objects[geom.id];

      this.dynqueue((fulldynamic)=>{
        this.parseDynamicFull(fulldynamic,existingobj);
        cb(cbdata);
      });
    } else if(forceFull){
      this.dynqueue((fulldynamic)=>{
        this.parseDynamicFull(fulldynamic,existingobj);
        cb(cbdata);
      });

    } else { //Need an updated dynamic shell.
      if (existingobj.version !== geom.version) {
        this.dynqueue((updateddynamic)=> {
          this.parseDynamicUpdate(updateddynamic, existingobj);
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
    let dyn = _.find(state.geom,['usage','inprocess']);
    _.each(this._objects,(obj)=>{
      obj.removeFromScene();
    });
    return new Promise((resolve)=>{
      this.handleDynamicGeom(dyn, forceDynamic, () => {
        let rtn = true;
        let loadingct = 0;
        this._curObjects = {};
        _.each(state.geom, (geomref) => {
          if(geomref.usage === 'inprocess' || geomref.usage === 'removal') return;
          if(this._objectCache[geomref.id] !==undefined){
            this._objectCache[geomref.id].addToScene(geomref.bbox,geomref.xform);
            this._curObjects[geomref.id] = this._objectCache[geomref.id];
            this._curObjects[geomref.id].usage = geomref.usage;
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
              this._objectCache[geomref.id].addToScene(geomref.bbox, geomref.xform);
              this._curObjects[geomref.id] = ev;
              this._curObjects[geomref.id].usage = geomref.usage;
              loadingct--;
              if(loadingct === 0){
                resolve(rtn);
              } else console.log('loadingct '+loadingct);
            });
          }
        })
        this._loader.runLoadQueue();
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
  toggleHighlight() { }
  toggleVisibility() { }
  toggleOpacity() { }

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

  toggleCollapsed() { }
  explode() { }
}
