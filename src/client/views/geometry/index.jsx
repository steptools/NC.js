'use strict';

import React from 'react';
import ViewerControls   from './viewer_controls';
import CompassView      from '../compass/compass';

export default class GeometryView extends React.Component{
  constructor(props) {
    super(props);

    this.state = {
      isViewChanging: false,
      lastHovered: undefined,
      oldColors: {}
    };

    this.invalidate     = this.invalidate.bind(this);
    this.alignToolView = this.alignToolView.bind(this);
    this.highlightFaces = this.highlightFaces.bind(this);
    this.onShellLoad    = this.onShellLoad.bind(this);
    this.onModelAdd     = this.onModelAdd.bind(this);
    this.onModelRemove  = this.onModelRemove.bind(this)
  }
  
  componentDidMount() {
    let self = this;
    // RENDERER
    this.canvasParent = document.getElementById('geometry-container');
    this.canvas = document.getElementById('cadjs-canvas');
    this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false
    });
    this.renderer.setClearColor(new THREE.Color(0x000000), 1);
    this.renderer.sortObjects = true;
    this.renderer.autoClear = false;

    // SCENES
    this.geometryScene = new THREE.Scene();
    this.annotationScene = new THREE.Scene();
    this.overlayScene = new THREE.Scene();

    // CAMERA
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.canvasParent.offsetWidth / this.canvasParent.offsetHeight,
      0.1,
      1000000
    );
    this.camera.position.x = -5000;
    this.camera.position.y = -5000;
    this.camera.position.z = 0;
    this.camera.lookAt(this.geometryScene.position);

    // VIEW CONTROLS
    this.controls =  new ViewerControls({
      viewer: this,
      camera: this.camera,
      canvas: this.renderer.domElement
    });

    // CONTROL EVENT HANDLERS
    this.controls.addEventListener('change', function(options) {
      //changing to this.props.changeCB(true); breaks this, figure out why
      self.state.isViewChanging = true;
      let x0 = self.sceneCenter,
          x1 = self.camera.position,
          x2 = self.controls.target,
          x2subX1 = x2.clone().sub(x1),
          x1subX0 = x1.clone().sub(x0),
          c = x2subX1.clone().cross(x1.clone().sub(x0)).lengthSq() / x2subX1.lengthSq(),
          d = Math.sqrt(Math.abs(c - x1subX0.lengthSq()));
      self.camera.near = Math.max(0.1, d - self.sceneRadius);
      self.camera.far = d + self.sceneRadius;
      self.camera.updateProjectionMatrix();
    if (!options.noInvalidate)
      self.invalidate();
    });
    this.controls.addEventListener("start", function() {
      self.continuousRendering = true;
      self.props.lockedCb(false);
    });
    this.controls.addEventListener("end", function() {
        self.invalidate();
        self.continuousRendering = false;
        self.state.isViewChanging = false;
    });

    // SCREEN RESIZE
    this.animate(true);
    this.handleResize();
  }

  onShellLoad(event) {
    // Get around the fact that viewerControls calls change a bunch at startup
    this.props.changeCb(true);
    this.invalidate(event);
  }
  
  onModelAdd(event) {
    //This is where the NC model is being loaded into the CADview
    let model = this.props.manager._models[event.path];
    // Add the model to the scene
    this.annotationScene.add(   model.getAnnotation3D());
    this.geometryScene.add(     model.getObject3D());
    this.overlayScene.add(      model.getOverlay3D());
    // calculate the scene's radius for draw distance calculations
    this.updateSceneBoundingBox(model.getBoundingBox());
  }

  onModelRemove(event) {
    console.log('ModelRemove: ' + event.path);
  }
  
  componentWillUpdate(nextProps, nextState) {
    // Unhighlight anything that's not being shown
    if ((this.props.selectedEntity !== null &&
        this.props.selectedEntity.type === 'tolerance')) {
      
      let workpiece = this.props.toleranceCache[this.props.selectedEntity.workpiece];
      
      if (workpiece.workingsteps.indexOf(this.props.ws) >= 0 ) {

        if (nextProps.selectedEntity === null ||
            nextProps.selectedEntity !== this.props.selectedEntity ||
            this.props.ws !== nextProps.ws) {
          
            this.highlightFaces(this.props.selectedEntity, this.props.manager.getSelected(), true);
        }
      }
    }
    // now highlight any tolerances present in current workingstep
    if (nextProps.selectedEntity !== null &&
        nextProps.selectedEntity.type === 'tolerance') {

      let workpiece = nextProps.toleranceCache[nextProps.selectedEntity.workpiece];
      // check if the selected tolerance/wp is used in the current WS
      if (workpiece.workingsteps.indexOf(nextProps.ws) >= 0) {
          
        let highlightColor = {
          r: 1.0,
          g: 0,
          b: 1.0
        };
        
        this.highlightFaces(nextProps.selectedEntity, nextProps.manager.getSelected(), false, highlightColor);
      }
    }
  }

  componentWillMount() {
    this.sceneCenter = new THREE.Vector3(0,0,0);
    this.sceneRadius = 10000;
    this.props.manager.addEventListener("model:add", this.onModelAdd);
    this.props.manager.addEventListener("model:remove", this.onModelRemove);
    this.props.manager.addEventListener("shellLoad", this.onShellLoad);
    this.props.manager.addEventListener("annotationLoad", this.invalidate);
    this.props.manager.addEventListener("invalidate", this.invalidate);
  }

  componentWillUnmount() {      
    this.props.manager.removeEventListener("model:add", this.onModelAdd);
    this.props.manager.removeEventListener("model:remove", this.onModelRemove);
    this.props.manager.removeEventListener("shellLoad", this.invalidate);
    this.props.manager.removeEventListener("annotationLoad", this.invalidate);
    this.props.manager.removeEventListener("invalidate", this.invalidate);
  }
  
  componentDidUpdate() {
    if (this.props.resize)
        this.handleResize();

    if (this.props.locked) {
        this.alignToolView(this.props.manager.getSelected());
        this.invalidate();
    }
  }

  handleResize() {
    this.renderer.setSize(this.canvasParent.offsetWidth, this.canvasParent.offsetHeight);
    this.camera.aspect = this.canvasParent.offsetWidth / this.canvasParent.offsetHeight;
    this.controls.handleResize();
    this.controls.dispatchEvent({ type: 'change' });
    this.drawScene();
  }

  static getAxisVector(vec) {
    // Find the closest axis-aligned unit vector to the given vector
    let absVec = new THREE.Vector3(Math.abs(vec.x), Math.abs(vec.y), Math.abs(vec.z));
    let rtn = new THREE.Vector3(0, 0, 0);

    if (absVec.x >= absVec.y && absVec.x >= absVec.z) {
      if (vec.x > 0)
        rtn.x = 1;
      else
        rtn.x = -1;
    }
    else if (absVec.y >= absVec.x && absVec.y >= absVec.z) {
      if (vec.y > 0)
        rtn.y = 1;
      else
        rtn.y = -1;
    }
    else if (absVec.z >= absVec.x && absVec.z >= absVec.y) {
      if (vec.z > 0)
        rtn.z = 1;
      else
        rtn.z = -1;
    }  
    
    return rtn;
  }

  alignToolView(objects) {
    
    if (objects[0] === undefined) return;

    // find the orientation of the referenced object
    let tool = _.find(_.values(objects[0]._objects), {'usage': 'cutter', 'rendered': true});
    let part = _.find(_.values(objects[0]._objects), {'usage': 'tobe', 'rendered': true});
    if (part === undefined)
      part = _.find(_.values(objects[0]._objects), {'usage': 'asis', 'rendered': true});

    let partPos = new THREE.Vector3().setFromMatrixPosition(part.object3D.matrixWorld);
    let toolBox = tool.model.getBoundingBox().clone();
      
    let toolMax = toolBox.max.clone().applyMatrix4(tool.object3D.matrixWorld);
    let toolMin = toolBox.min.clone().applyMatrix4(tool.object3D.matrixWorld);
  
    let toolAxis = GeometryView.getAxisVector(toolMax.clone().sub(toolMin));
    
    let toolPos = tool.object3D.position.clone().sub(partPos);

    let newUp = toolAxis.clone()
  
    // get the unit vector corresponding to this view
    newUp = GeometryView.getAxisVector(newUp);

    // now calculate which side we want to view from
    // TODO: make sure fixtures work properly with changes to underlying stuff, and with machines loaded
    let fixture = _.find(_.values(objects[0]._objects), {'usage': 'fixture', 'rendered': true});
    let newPos = new THREE.Vector3();
    if (fixture !== undefined) {
      let fixtureMax = fixture.bbox.max.clone();
      let fixtureMin = fixture.bbox.min.clone();
      let fixtureDiag = fixtureMax.clone().sub(fixtureMin);

      let fixturePos = fixture.object3D.position.clone();

      let fixLen = GeometryView.getAxisVector(fixtureDiag);

      newPos.crossVectors(fixLen, newUp);
      if (newPos.length() === 0) {
        if (newUp.x === 0)
          newPos.x = 1;
        else
          newPos.y = 1;
      }

      // make sure the fixture is facing away from us if it would block view of the part
      if (fixturePos.dot(newPos) < 0)
        newPos.negate();
    }
    // we have no fixture
    else {
      newPos.crossVectors(newUp, new THREE.Vector3(1, 0, 0));
      if (newPos.length() === 0)
        newPos.crossVectors(newUp, new THREE.Vector3(0, 1, 0));
    }

    // TODO: See if we can actually use the tool in calculations
    // zoom to fit just the part
    let boundingBox = new THREE.Box3().union(part.bbox).union(toolBox.applyMatrix4(tool.object3D.matrixWorld));
    let radius = boundingBox.size().length() * 0.5;
    let horizontalFOV = 2 * Math.atan(THREE.Math.degToRad(this.camera.fov * 0.5) * this.camera.aspect),
        fov = Math.min(THREE.Math.degToRad(this.camera.fov), horizontalFOV),
        dist = radius / Math.sin(fov * 0.5),
        newTargetPosition = boundingBox.max.clone().
        lerp(boundingBox.min, 0.5);
  
    // adjust the camera position based on the new target
    this.camera.position
        .sub(this.controls.target)
        .setLength(dist)
        .add(newTargetPosition);
    this.controls.target.copy(newTargetPosition);

    this.controls.alignTop(newUp, newPos);

  }

  highlightFaces(entity, objs, unhighlight, newColor) {
    let shells = _.filter(_.values(objs[0]._objects), _.matches({usage: 'tobe'}) || _.matches({usage: 'asis'}));
    _.each(shells, (shell) => {
      if (shell && shell.model._geometry) {
        let faces = shell.model._geometry.getAttribute('faces');
        let colors = shell.model._geometry.getAttribute('color');

        let indices = _.map(entity.faces, (id) => faces.array[id]);

        if (!unhighlight && !this.state.oldColors[shell.id]) {
          let oldColors = this.state.oldColors;
          oldColors[shell.id] = colors.clone();
          this.setState({'oldColors': oldColors});
        }

        _.each(indices, (index) => {
          if (index) {
            for (let i = index.start; i < index.end; i += 3) {
              
              if (unhighlight) {
                colors.array[i] = this.state.oldColors[shell.id].array[i];
                colors.array[i + 1] = this.state.oldColors[shell.id].array[i + 1];
                colors.array[i + 2] = this.state.oldColors[shell.id].array[i + 2];
              }
              else {
                colors.array[i] = newColor.r;
                colors.array[i + 1] = newColor.g;
                colors.array[i + 2] = newColor.b;
              }
            }
          }
        });
        
        colors.needsUpdate = true;
        this.invalidate();
      }
    });
  }

  animate(forceRendering) {
    let self = this;
    window.requestAnimationFrame(function() {
      self.animate(false);
    });
    if (this.continuousRendering === true || this.shouldRender === true || forceRendering === true) {
      if (this.props.locked)
        this.alignToolView(this.props.manager.getSelected());
      this.shouldRender = false;
      this.drawScene();
      this.controls.update();
      // Tell anyone listening to update their view
      this.props.manager.dispatchEvent({ type: 'render:update' });
    }
  }

  updateSceneBoundingBox(newBoundingBox) {
    this.sceneCenter.copy(newBoundingBox.center());
    this.sceneRadius = newBoundingBox.size().length() / 2;
  }

  drawScene() {
    this.renderer.clear();
    this.renderer.render(this.geometryScene, this.camera);
    this.renderer.render(this.overlayScene, this.camera);
    this.renderer.render(this.annotationScene, this.camera);
  }

  invalidate(options) {
    if (options) {
      if (options.boundingBox) {
        // then update the bounding box for the new model
        this.updateSceneBoundingBox(options.model.getBoundingBox());

        this.controls.dispatchEvent({type: 'change', 'noInvalidate': true });
      }
    }
    this.shouldRender = true;
  }
  
  render() {
    let compass = this.camera ? <CompassView
      compassParentId="cadjs-canvas"
      camera={this.camera}
      controls={this.controls}
      dispatcher={this.props.manager}
      guiMode={this.props.guiMode}
    /> : undefined;
    return <div id='geometry-container'>
      <canvas id="cadjs-canvas" onMouseUp={this.props.onMouseUp} onMouseMove={this.onMouseMove} />
      {compass}
    </div>;
    }
};
