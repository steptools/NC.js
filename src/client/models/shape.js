/* G. Hemingway Copyright @2014
 * Shape class for the CAD models
 */
"use strict";


import Shell from './shell';
import Annotation from './annotation';

/********************************* Shape Class ********************************/
export default class Shape extends THREE.EventDispatcher {
    constructor(shapeJSON,manager,id) {
        super();
        this._manager=manager;
        this.id = id;
        this._shells = [];
        this._annotations = [];
        this._geoms = new THREE.Group();
        this._geoms.userData.id = id;
        this._bbox = [0,0,0,0,0,0];
        this._transform = new THREE.Matrix4();
        this._inScene = false;
        this._isVisible = false;
        _.each(shapeJSON,(geom)=>{
           switch(geom.type){
               case 'mesh':
                   let shell = new Shell(geom.geom);
                   this._geoms.add(shell.getGeometry());
                   this._shells.push(shell);
                   break;
               case 'annotation':
                   let anno = new Annotation(geom.geom);
                   this._geoms.add(ann.getGeometry());
                   this._annotations.push();
                   break;
               case 'default':
                   console.log('unexpected item in bagging area');
                   break;
           } 
        })
        return this;
    }
    toggleVisibility(){
        this._geoms.visible = !this._geoms.visible;
    }
    isVisible(){
        return this._geoms.visible;
    }
    getBoundingBox(){
        return new THREE.Box3().setFromObject(this._geoms);
    }
    getGeometry(){
        return this._geoms;
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

    addToScene(bbox,xform){
        let transform = new THREE.Matrix4();
        transform.set(
            xform[0],xform[4],xform[8],xform[12],
            xform[1],xform[5],xform[9],xform[13],
            xform[2],xform[6],xform[10],xform[14],
            xform[3],xform[7],xform[11],xform[15],
        )
        this._geoms.applyMatrix(transform);
        this._geoms.updateMatrixWorld();
        this._bbox = bbox;
        this._transform = transform;
        if(this._inScene) return;
        this._manager.addShape(this);
        this._inScene = true;
    };
    removeFromScene(){
        if(!this._inScene) return;
        this._manager.removeShape(this);
        this._inScene = false;  
    };
};
