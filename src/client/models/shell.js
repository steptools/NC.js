/* G. Hemingway Copyright @2014
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

    getGeometry() {
        return this._geometry;
    }

    setGeometry(geom) {
        this._geometry = geom;
    }
    
    show(){
        this._geometry.setDrawRange(0,Infinity);
    }
    hide(){
        this._geometry.setDrawRange(0,0);
    }
    _faceload(facesJSON){
        let rtn = {
            faces:[],
            colors:[]
        };
        let arr = [];
        for(let i=0;i<facesJSON.length;i++){
            arr = new Array(facesJSON[i].count);
            arr.fill(facesJSON[i].id);
            rtn.faces = rtn.faces.concat(arr);
            if(facesJSON[i].color!=null){
                arr.fill(facesJSON[i].color); //[[0.5,0.5,0.5],[0.5,0.5,0.5]...[0.5,0.5,0.5]]
            } else {
                arr.fill(defaultColor);
            }
            rtn.colors = rtn.colors.concat(_.flatten(arr)); //flatten makes above [0.5,0.5,0.5,0.5,0.5,0.5...0.5,0.5,0.5]
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
        let faceids = Int32Array.from(faces.faces);
        let colors = Float32Array.from(faces.colors);
        geom.addAttribute('faces',    new THREE.BufferAttribute(faceids, 1));
        geom.addAttribute('color',    new THREE.BufferAttribute(colors, 3));

        // Compute bbox
        geom.computeBoundingBox();
        this._boundingBox = geom.boundingBox.clone();
        this._geometry = new THREE.Mesh(geom,MESHMATERIAL,false);
        this._geometry.castShadow = true;
        this._geometry.receiveShadow = true;
        // All done - signal completion
        this._isLoaded = true;
        this.dispatchEvent({type: "shellEndLoad", shell: this});
    }
};
