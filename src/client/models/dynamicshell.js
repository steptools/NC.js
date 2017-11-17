/* 
 * Copyright (c) 2016-2017 by STEP Tools Inc. 
 * G. Hemingway Copyright @2016
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
 * Process shell geometry data from wire format to internal
 */
"use strict";

let MESHMATERIAL = new THREE.ShaderMaterial(new THREE.VelvetyShader());
let defaultColor = [0.7,0.5,0.5];

export default class DynamicShell extends THREE.EventDispatcher {
    constructor(dynamicShellJSON,manager,id) {
        super();
        this._manager = manager;
        this.id = id;
        let geom = this.addGeometry(dynamicShellJSON);
        this._mesh = new THREE.Mesh(geom,MESHMATERIAL,false);
        this._mesh.matrixAutoUpdate = false;
        this.getGeometry = this.getGeometry.bind(this);
        this.getMesh = this.getMesh.bind(this);
    }

    getID() {
        return this.id;
    }
    getBoundingBox() {
        return new THREE.Box3().setFromObject(this._mesh);
    }
    toggleVisibility(){
        this._mesh.visible = !this._mesh.visible;
    }
    isVisible(){
        return this._mesh.visible;
    }
    getMesh(){
        return this._mesh;
    }
    getGeometry() {
        return this._mesh;
    }
    show(){
        this._mesh.visible = true;
    }
    hide(){
        this._mesh.visible = false;
    }
    repositionInScene(bbox,xform){
        this._mesh.matrix.set(
            xform[0],xform[4],xform[8],xform[12],
            xform[1],xform[5],xform[9],xform[13],
            xform[2],xform[6],xform[10],xform[14],
            xform[3],xform[7],xform[11],xform[15],
        )
        let transform = new THREE.Matrix4();
        transform.copy(this._mesh.matrix);
        this._bbox = bbox;
        this._transform = transform;
    }
    addToScene(bbox,xform,sequence){

        this._mesh.matrix.set(
            xform[0],xform[4],xform[8],xform[12],
            xform[1],xform[5],xform[9],xform[13],
            xform[2],xform[6],xform[10],xform[14],
            xform[3],xform[7],xform[11],xform[15],
        )
        let transform = new THREE.Matrix4();
        transform.copy(this._mesh.matrix);
        this._bbox = bbox;
        this._transform = transform;
        if(this._inScene) return;
        this._manager.addShape(this,sequence);
        this._inScene = true;
    };

    removeFromScene(sequence){
        if(!this._inScene) return;
        this._manager.removeShape(this,sequence);
        this._inScene = false;  
    };
    
    _faceload(facesJSON,length){
        let colors = new Float32Array(length);
        let pos=0;
        let r = 0;
        let g = 0;
        let b = 0;
        for (let i = 0; i < facesJSON.length; i++) {
            if (facesJSON[i].color != null) {
                r = facesJSON[i].color[0];
                g = facesJSON[i].color[1];
                b = facesJSON[i].color[2];
            } else {
                r = defaultColor[0];
                g = defaultColor[1];
                b = defaultColor[2];
            }
            for (let j = 0; j < facesJSON[i].count; j++) {
                colors[pos++] = r;
                colors[pos++] = g;
                colors[pos++] = b;
            }
        }
        return colors;
    }
    replaceGeometry(shellJSON){
        let geom = this.addGeometry(shellJSON);
        this._mesh.geometry.dispose();
        this._mesh.geometry = geom.clone();
    }
    addGeometry(shellJSON) {
        // Create the geometry to hold the data
        let geometry = new THREE.BufferGeometry();
        let factor = Math.pow(10, (-1 * shellJSON.precision));
        let sz = shellJSON.points.length;
        let positions = new Float32Array(sz);
        let normals = new Float32Array(sz);
        let i = 0;
        for(i=0;i<sz;i++){
            positions[i] = shellJSON.points[i]*factor;
            normals[i] = shellJSON.normals[i]*factor;
        }
        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
        let colors = this._faceload(shellJSON.faces,sz);
        geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Compute bbox
        geometry.computeBoundingBox();

        return geometry;
    }
}
