/* G. Hemingway Copyright @2015
 * Manage the drawing context/canvas as a React View
 */

"use strict";


let _                   = require('lodash');
import React            from 'react';
import ViewerControls   from './viewer_controls';
import CompassView      from '../compass/compass';
import LoadQueueView    from '../load_queue';

// Import shaders
require('./shaders/VelvetyShader');


/*************************************************************************/

class ViewButton extends React.Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    let icon = "unlock";
    if (this.props.locked)
      icon = "lock";
    
    return <div className="resetview">
      <span
        className={"glyphicons glyphicons-eye-open" + (this.props.locked ? ' locked' : '')}
        onClick={this.props.alignCb}
      />
      <span
        className={"lock glyphicons glyphicons-" + icon + (this.props.locked ? ' locked' : '')}
        onClick = {this.props.toggleLock}
      />
    </div>;
  }
}

/*************************************************************************/

export default class CADView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            modelTree: {},
            isViewChanging: false,
            lastHovered: undefined,
            lockedView: false
        };
        this.handleResize   = this.handleResize.bind(this);
        this.onShellLoad    = this.onShellLoad.bind(this);
        this.onModelAdd     = this.onModelAdd.bind(this);
        this.onModelRemove  = this.onModelRemove.bind(this);
        this.invalidate     = this.invalidate.bind(this);
        this.onKeypress     = this.onKeypress.bind(this);
        this.onMouseUp      = this.onMouseUp.bind(this);
        this.onMouseMove    = this.onMouseMove.bind(this);
        this.onTreeClick    = this.onTreeClick.bind(this);
        this.onTreeChange   = this.onTreeChange.bind(this);
        this.onTreeNodeEnterExit = this.onTreeNodeEnterExit.bind(this);
        this.alignToolView = this.alignToolView.bind(this);
    }

    onShellLoad(event) {
        // Get around the fact that viewerControls calls change a bunch at startup
        this.setState({'isViewChanging':true});
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
        
        // set the default view
        this.alignToolView([model]);
        this.invalidate();
        
        // Update the model tree
        let tree = this.props.manager.getTree();
        this.setState({ modelTree:tree });
    }

    onModelRemove(event) {
        console.log('ModelRemove: ' + event.path);
        // TODO: Need to do anything here?
        // Update the model tree
        let tree = this.props.manager.getTree();
        this.setState({ modelTree: tree });
    }

    onKeypress(event) {
        switch(event.keyCode || event.charCode || event.which) {

            case 27:
                this.props.openProperties(null);
                break;

            // Go to special viewing postion on 'a'
            case 97:
                //console.log(this.camera);
                this.alignToolView(this.props.manager.getSelected());
                this.invalidate();
                break;
            // Explode on 'x' key pressed
            case 120:
                this.props.manager.explode(10);
                break;
            // Unexplode on 's' key pressed
            case 115:
                this.props.manager.explode(-10);
                break;
            // 'q' reset all elements
            case 113:
                this.props.manager.clear();
                break;
            // 'o' to toggle transparency
            case 111:
                this.props.manager.toggleOpacity();
                break;
            // 'z' to zoomToFit
            case 122:
                let objs = this.props.manager.getSelected();
                this.zoomToFit(objs);
                break;
            // 'j' hide/show element
            case 106:
                this.props.manager.toggleVisibility();
                break;
        }
        this.invalidate({ tree: true });
    }

    componentWillMount() {
        this.sceneCenter = new THREE.Vector3(0,0,0);
        this.sceneRadius = 10000;
        this.props.manager.addEventListener("model:add", this.onModelAdd);
        this.props.manager.addEventListener("model:remove", this.onModelRemove);
        this.props.manager.addEventListener("shellLoad", this.onShellLoad);
        this.props.manager.addEventListener("annotationLoad", this.invalidate);
        this.props.manager.addEventListener("invalidate", this.invalidate);
        // Keybased events
        window.addEventListener("keydown", this.onKeypress, true);
        window.addEventListener("keypress", this.onKeypress, true);
    }

    componentDidMount() {
        let self = this;
        // RENDERER
        this.canvasParent = document.getElementById('cadjs-container');
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
            self.setState({'lockedView': false});
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

    componentWillUnmount() {
        window.removeEventListener("keypress", this.onKeypress);
        window.removeEventListener("keydown", this.onKeypress);
        this.props.manager.removeEventListener("model:add", this.onModelAdd);
        this.props.manager.removeEventListener("model:remove", this.onModelRemove);
        this.props.manager.removeEventListener("shellLoad", this.invalidate);
        this.props.manager.removeEventListener("annotationLoad", this.invalidate);
        this.props.manager.removeEventListener("invalidate", this.invalidate);
    }
    
    componentWillUpdate(nextProps, nextState) {
        if (!this.state.lockedView && nextState.lockedView) {
            this.alignToolView(this.props.manager.getSelected());
            this.invalidate();
        }
    }

    componentDidUpdate() {
        if (this.props.resize)
            this.handleResize();
    }

    handleResize() {
        this.renderer.setSize(this.canvasParent.offsetWidth, this.canvasParent.offsetHeight);
        this.camera.aspect = this.canvasParent.offsetWidth / this.canvasParent.offsetHeight;
        this.controls.handleResize();
        this.controls.dispatchEvent({ type: 'change' });
        this.drawScene();
    }

    zoomToFit(objects) {
        if (!objects || objects.length === 0) return;
        let object = objects[0];
        let object3d = object.getObject3D(),
            boundingBox = object.getBoundingBox(),
            radius = boundingBox.size().length() * 0.5,
            horizontalFOV = 2 * Math.atan(THREE.Math.degToRad(this.camera.fov * 0.5) * this.camera.aspect),
            fov = Math.min(THREE.Math.degToRad(this.camera.fov), horizontalFOV),
            dist = radius / Math.sin(fov * 0.5),
            newTargetPosition = boundingBox.max.clone().
            lerp(boundingBox.min, 0.5).
            applyMatrix4(object3d.matrixWorld);
        this.camera.position
            .sub(this.controls.target)
            .setLength(dist)
            .add(newTargetPosition);
        this.controls.target.copy(newTargetPosition);
        this.invalidate();
    }

    alignToolView(objects) {
        
        // find the orientation of the referenced object
        let tool = _.find(_.values(objects[0]._objects), {'usage': 'cutter', 'rendered': true});
        let part = _.find(_.values(objects[0]._objects), {'usage': 'tobe', 'rendered': true});
        if (part === undefined)
          part = _.find(_.values(objects[0]._objects), {'usage': 'asis', 'rendered': true});

        let partPos = new THREE.Vector3().setFromMatrixPosition(part.object3D.matrixWorld);
        let toolBox = tool.model.getBoundingBox().clone();
          
        let toolMax = toolBox.max.clone().applyMatrix4(tool.object3D.matrixWorld);
        let toolMin = toolBox.min.clone().applyMatrix4(tool.object3D.matrixWorld);
      
        let toolAxis = CADView.getAxisVector(toolMax.clone().sub(toolMin));
        
        let toolPos = tool.object3D.position.clone().sub(partPos);

        let newUp = toolAxis.clone()
      
        // get the unit vector corresponding to this view
        newUp = CADView.getAxisVector(newUp);

        // now calculate which side we want to view from
        // TODO: make sure fixtures work properly with changes to underlying stuff, and with machines loaded
        let fixture = _.find(_.values(objects[0]._objects), {'usage': 'fixture', 'rendered': true});
        let newPos = new THREE.Vector3();
        if (fixture !== undefined) {
          let fixtureMax = fixture.bbox.max.clone();
          let fixtureMin = fixture.bbox.min.clone();
          let fixtureDiag = fixtureMax.clone().sub(fixtureMin);

          let fixturePos = fixture.object3D.position.clone();

          let fixLen = CADView.getAxisVector(fixtureDiag);

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

    drawScene() {
        this.renderer.clear();
        this.renderer.render(this.geometryScene, this.camera);
        this.renderer.render(this.overlayScene, this.camera);
        this.renderer.render(this.annotationScene, this.camera);
    }

    animate(forceRendering) {
        let self = this;
        window.requestAnimationFrame(function() {
            self.animate(false);
        });
        if (this.continuousRendering === true || this.shouldRender === true || forceRendering === true) {
            if (this.state.lockedView)
              this.alignToolView(this.props.manager.getSelected());
            this.shouldRender = false;
            this.drawScene();
            this.controls.update();
            // Tell anyone listening to update their view
            this.props.manager.dispatchEvent({ type: 'render:update' });
        }
    }

    invalidate(options) {
        if (options) {
          if (options.tree) {
            // Update the model tree
            let tree = this.props.manager.getTree();
            this.setState({modelTree: tree});
          }
          else if (options.boundingBox) {
            // then update the bounding box for the new model
            this.updateSceneBoundingBox(options.model.getBoundingBox());

            this.controls.dispatchEvent({type: 'change', 'noInvalidate': true });
          }
        }
        this.shouldRender = true;
    }

    updateSceneBoundingBox(newBoundingBox) {
        this.sceneCenter.copy(newBoundingBox.center());
        this.sceneRadius = newBoundingBox.size().length() / 2;
    }

    // Handle all object selection needs
    handleSelection(obj, event) {
        let change = false, flip = false;
        let selected = this.props.manager.getSelected();
        // Toggle selection if already selected
        if (obj && selected.length === 1 && selected[0].getID() === obj.getID()) {
            flip = true;
        }
        // Allow meta for multi-selection
        if (!event.metaKey && !flip) {
            // Clear all currently selected objects
            this.props.manager.clearSelected(selected);
            change = true;
        }
        // Did we find an object
        if (obj) {
            obj = obj.getNamedParent();
            // Toggle the bounding box
            obj.toggleSelection();
            change = true;
        }
        if (change) {
            // Update the model tree
            let tree = this.props.manager.getTree();
            this.setState({ modelTree: tree });
            this.invalidate();
        }
    }

    // Handle clicking in the model view for selection
    onMouseUp(event) {
        if (!this.state.isViewChanging && this.props.manager.modelCount() > 0) {
            let obj = this.props.manager.hitTest(this.camera, event);
            this.handleSelection(obj, event);
        }
    }

    // Handle clicking in the model tree for selection
    onTreeClick(node, event) {
        this.handleSelection(node.obj, event);
    }

    // Handle synchronization of collapse/expand in the tree
    onTreeChange(tree, parent, node) {
        if (!parent && node) {
            node.obj.toggleCollapsed();
            tree = this.props.manager.getTree();
            this.setState({ modelTree: tree });
        }
    }

    // Handle all object highlighting needs
    handleHighlighting(obj) {
        let change = false;
        if (this.state.lastHovered && (!obj || obj.getID() != this.state.lastHovered.getID())) {
            // Clear existing highlight
            this.state.lastHovered.toggleHighlight();
            change = true;
        }
        // Did we find a new object
        if (obj && (!this.state.lastHovered || obj.getID() != this.state.lastHovered.getID())) {
            obj = obj.getNamedParent();
            // Yes, go highlight it in the tree
            obj.toggleHighlight(0xffff60);
            change = true;
        }
        // Update the model tree and redraw if things have changed
        if (change) {
            let tree = this.props.manager.getTree();
            this.setState({ modelTree: tree });
            this.invalidate();
        }
        this.state.lastHovered = obj;
    }

    // Handle mouse movements in the model view for highlighting
    onMouseMove(event) {
        if (!this.state.isViewChanging && this.props.manager.modelCount() > 0) {
            let obj = this.props.manager.hitTest(this.camera, event);
            this.handleHighlighting(obj);
        }
    }

    // Handle mouse movements in the model tree for highlighting
    onTreeNodeEnterExit(node) {
        this.handleHighlighting(node.obj);
    }

    render() {
        let compass = this.camera ? <CompassView
            compassParentId="cadjs-canvas"
            camera={this.camera}
            controls={this.controls}
            dispatcher={this.props.manager}
            guiMode={this.props.guiMode}
        /> : undefined;

        return <div id='cadjs-container'>
            <canvas id="cadjs-canvas" onMouseUp={this.onMouseUp} onMouseMove={this.onMouseMove} />
            <ViewButton
              alignCb={() => {
                this.alignToolView(this.props.manager.getSelected());
                this.invalidate();
              }}
              toggleLock={() => {this.setState({'lockedView': !this.state.lockedView});}}
              locked = {this.state.lockedView}
            />
            {compass}
            <LoadQueueView dispatcher={this.props.manager} guiMode={this.props.guiMode} />
        </div>;
    }
};

CADView.propTypes = {
    manager: React.PropTypes.object.isRequired
};
