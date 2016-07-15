'use strict';

import React from 'react';
import CADView from '../cad';
import CompassView      from '../compass/compass';
import ViewerControls from '../cad/viewer_controls';

export default class PreviewPane extends CADView {
  constructor(props) {
    super(props);
  }
  
  componentDidMount() {
    let self = this;
    // RENDERER
    this.canvasParent = document.getElementById('preview-container');
    this.canvas = document.getElementById('preview-canvas');
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
  
  render() {
    
    return <div id='preview-container'>
      <canvas id="preview-canvas" onMouseUp={this.onMouseUp} onMouseMove={this.onMouseMove} />
    </div>;
    }
};
