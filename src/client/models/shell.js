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
 * Shell class handles all of the actual geometry - shared between Shapes
 */
"use strict";


/********************************* Helper Functions ********************************/
require('../views/cad/shaders/VelvetyShader');
let MESHMATERIAL = new THREE.ShaderMaterial(new THREE.VelvetyShader());
let defaultColor = [0.7,0.5,0.5];
export default class Shell extends THREE.EventDispatcher {
    constructor(shellJSON) {
        super();
        this.addGeometry(shellJSON);
        this.getGeometry = this.getGeometry.bind(this);
        this.getMesh = this.getMesh.bind(this);
    }

    getFaces(){
        return this._faces;
    }
    getID() {
        return this._id;
    }

    getNamedParent() {
        return this._parent;
    }

    getBoundingBox() {
        return this._boundingBox;
    }

    getMesh() {
        return this._mesh;
    }

    getGeometry() {
        return this._mesh.geometry;
    }

    setGeometry(geom) {
        this._mesh = geom;
    }
    
    show(){
        this._mesh.setDrawRange(0,Infinity);
    }
    hide(){
        this._mesh.setDrawRange(0,0);
    }
    _faceload(facesJSON){
        let rtn = {
            faces:{},
            colors:[]
        };
        let curpos = 0;
        for(let i=0;i<facesJSON.length;i++){
            let face = {
                'start':curpos,
                'end':(curpos+facesJSON[i].count)-1
            };
            curpos = curpos+facesJSON[i].count;
            rtn.faces[facesJSON[i].id] = face;
            let newColor = [];
            if(facesJSON[i].color!=null){
                newColor = facesJSON[i].color;
            } else {
                newColor = defaultColor;
            }
            for(let j=0;j<facesJSON[i].count;j++){
              rtn.colors.push.apply(rtn.colors,newColor);
            }
        }
        return rtn;
    }
    addGeometry(shellJSON) {
        this.dispatchEvent({type: "shellStartLoad", shell: this});
        let geom = new THREE.BufferGeometry();
        let _size = shellJSON.normals.length;
        let factor = Math.pow(10,(-1*shellJSON.precision));
        let positions = Float32Array.from(_.map(shellJSON.points, (p) => { return (p * factor) }));
        let normals = Float32Array.from(_.map(shellJSON.normals, (n) => { return (n * factor) }));

        geom.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.addAttribute('normal',   new THREE.BufferAttribute(normals, 3));
        let faces = this._faceload(shellJSON.faces);
        let colors = Float32Array.from(faces.colors);
        geom.addAttribute('color',    new THREE.BufferAttribute(colors, 3));
        this._faces = faces.faces;

        // Compute bbox
        geom.computeBoundingBox();
        this._boundingBox = geom.boundingBox.clone();
        this._mesh = new THREE.Mesh(geom,MESHMATERIAL,false);
        this._mesh.castShadow = true;
        this._mesh.receiveShadow = true;
        // All done - signal completion
        this._isLoaded = true;
        this.dispatchEvent({type: "shellEndLoad", shell: this});
    }
};
