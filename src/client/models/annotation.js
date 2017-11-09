/* 
 * Copyright (c) 2016-2017 by STEP Tools Inc. 
 * Copyright G. Hemingway, 2015
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

"use strict";


/********************************* Annotation Class ********************************/

export default class Annotation extends THREE.EventDispatcher {
  constructor(annoJSON){
    super();
    this._geometry = new THREE.Group();
    this.addGeometry(annoJSON);
  }

  getGeometry(){
    return this._geometry;
  }
  getID() {
    return this._id;
  }
  show(){
    this._geometry.setDrawRange(0,Infinity);
  }
  hide(){
    this._geometry.setDrawRange(0,0);
  }

  addGeometry(data) {
    let material = new THREE.LineBasicMaterial({
      vertexColors: THREE.VertexColors,
      linewidth:1
    });
    for (const polyline of data) {
      let geometry = new THREE.BufferGeometry();
      //load points & colors
      let vertices = new Float32Array(polyline.points.length * 3);
      let colorArray = new Float32Array(polyline.points.length * 3);
      _.forEach(polyline.points, (point, index) => {
        let bufferIndex = index*3;
        vertices[bufferIndex]     = point[0];            // X
        vertices[bufferIndex + 1] = point[1];            // Y
        vertices[bufferIndex + 2] = point[2];            // Z
        colorArray[bufferIndex]     = polyline.color[0]; // R
        colorArray[bufferIndex + 1] = polyline.color[1]; // G
        colorArray[bufferIndex + 2] = polyline.color[2]; // B
      });
      let position = new THREE.BufferAttribute(vertices, 3);
      geometry.addAttribute('position', position);
      let color = new THREE.BufferAttribute(colorArray, 3);
      geometry.addAttribute('color', color);
      this._geometry.add(new THREE.Line(geometry,material));
    }
    // All done - signal completion
    this.dispatchEvent({ type: "annotationEndLoad", annotation: this });
  }

  toggleScene() {
    if (this.visible) this.removeFromScene();
    else this.addToScene();
  }

  addToScene() {
    this.dispatchEvent({ type: "annotationMakeVisible", annotation: this });
    this.visible = true;
  }
  removeFromScene() {
    this.dispatchEvent({ type: "annotationMakeNonVisible", annotation: this });
    this.visible = false;
  }
};
