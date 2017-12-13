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
 * Shape class for the CAD models
 */
"use strict";


import Point from './point';
import Shell from './shell';
import Annotation from './annotation';

/********************************* Shape Class ********************************/
export default class Shape extends THREE.EventDispatcher {
    constructor(shapeJSON,manager,id) {
        super();
        this._manager=manager;
        this._id = id;
        this.id = id;
        this._shells = [];
        this._annotations = [];
        this._points = [];
        this._geoms = new THREE.Group();
        this._geoms.userData.id = id;
        this._geoms.matrixAutoUpdate = false;
        this._bbox = new THREE.Box3();
        this._transform = new THREE.Matrix4();
        this._up = new THREE.Vector3();
        this._inScene = false;
        this._isVisible = false;
        _.each(shapeJSON,(geom)=>{
           switch(geom.type){
               case 'mesh':
                   let shell = new Shell(geom.geom);
                   this._geoms.add(shell.getMesh());
                   this._shells.push(shell);
                   break;
               case 'polyline':
                   let anno = new Annotation(geom.geom);
                   this._geoms.add(anno.getGeometry());
                   this._annotations.push();
                   break;
               case 'point':
                   let point = new Point(geom.geom);
                   this._geoms.add(point.getPoint());
                   this._points.push(point);
                   break;
               default:
                   console.log('unexpected item in bagging area');
                   break;
           } 
        })
        this.binders = this.binders.bind(this);
        this.binders();
        
        return this;
    }
    binders(){
        this.toggleVisibility = this.toggleVisibility.bind(this);
        this.isVisible = this.isVisible.bind(this);
        this.getBoundingBox = this.getBoundingBox.bind(this);
        this.getGeometry = this.getGeometry.bind(this);
        this.getUpVector = this.getUpVector.bind(this);
        this.getShells = this.getShells.bind(this);
        this.setManager = this.setManager.bind(this);
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.addToScene = this.addToScene.bind(this);
        this.removeFromScene = this.removeFromScene.bind(this)
    }
    toggleVisibility(){
        this._geoms.visible = !this._geoms.visible;
    }
    isVisible(){
        return this._geoms.visible;
    }
    getBoundingBox(){
        let rtn = new THREE.Box3().setFromObject(this._geoms);
        if(rtn.max.x === -Infinity) return this._bbox;
        return rtn;
    }
    getUpVector(){
        return this._up;
    }
    getGeometry(){
        return this._geoms;
    }
    getShells(){
        return this._shells;
    }
    getID(){
        return this._id;
    }
    setManager(manager){
        this._manager = manager;
    }
    show(){
        this._geoms.visible = true;
    }

    hide(){
        this._geoms.visible = false;
    }
    isInScene(){
        return this._inScene;
    }
    repositionInScene(bbox,xform){
        let transform = new THREE.Matrix4();
        transform.set(
            xform[0],xform[4],xform[8],xform[12],
            xform[1],xform[5],xform[9],xform[13],
            xform[2],xform[6],xform[10],xform[14],
            xform[3],xform[7],xform[11],xform[15],
        )
        this._up = new THREE.Vector3(xform[2],xform[6],xform[10]);
        this._geoms.matrix.copy(transform);
        this._bbox = new THREE.Box3(new THREE.Vector3(bbox[0],bbox[1],bbox[2]),new THREE.Vector3(bbox[3],bbox[4],bbox[5]));
        this._transform = transform;
    }
    addToScene(bbox,xform,sequence){
        let transform = new THREE.Matrix4();
        transform.set(
            xform[0],xform[4],xform[8],xform[12],
            xform[1],xform[5],xform[9],xform[13],
            xform[2],xform[6],xform[10],xform[14],
            xform[3],xform[7],xform[11],xform[15],
        )
        this._up = new THREE.Vector3(xform[2],xform[6],xform[10]);
        this._geoms.matrix.copy(transform);
        this._bbox = new THREE.Box3(new THREE.Vector3(bbox[0],bbox[1],bbox[2]),new THREE.Vector3(bbox[3],bbox[4],bbox[5]));
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
};
