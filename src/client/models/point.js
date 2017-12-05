/* 
 * Copyright (c) 2016-2017 by STEP Tools Inc. 
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

require('../views/cad/shaders/VelvetyShader');
let POINTSMATERIAL = new THREE.PointsMaterial({size:3});
export default class Point extends THREE.EventDispatcher {
    constructor(pointJSON){
        super();
        this.addGeometry(pointJSON);
        this.getGeometry = this.getGeometry.bind(this);
        this.getPoint = this.getPoint.bind(this);
    }
    getGeometry(){
        return this._point.geometry;
    }
    getPoint() {
        return this._point;
    }
    getBoundingBox() {
        return this._boundingBox;
    }
    addGeometry(pointJSON){
        let geom = new THREE.BufferGeometry();
        let position = Float32Array.from(pointJSON.coords);
        geom.addAttribute('position', new THREE.BufferAttribute(position,3));
        geom.computeBoundingBox();
        this._boundingBox = geom.boundingBox.clone();
        
        this._point = new THREE.Points(geom, POINTSMATERIAL);
    }
}