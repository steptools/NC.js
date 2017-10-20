/* G. Hemingway Copyright @2016
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
    addToScene(bbox,xform){

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
        this._manager.addShape(this);
        this._inScene = true;
    };

    removeFromScene(){
        if(!this._inScene) return;
        this._manager.removeShape(this);
        this._inScene = false;  
    };
    
    _faceload(facesJSON){
        let colors = [];
        let arr = [];
        for(let i=0;i<facesJSON.length;i++){
            arr = new Array(facesJSON[i].count);
            if(facesJSON[i].color!=null){
                arr.fill(facesJSON[i].color); //[[0.5,0.5,0.5],[0.5,0.5,0.5]...[0.5,0.5,0.5]]
            } else {
                arr.fill(defaultColor);
            }
            colors = colors.concat(_.flatten(arr)); //flatten makes above [0.5,0.5,0.5,0.5,0.5,0.5...0.5,0.5,0.5]
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
        let positions = Float32Array.from(_.map(shellJSON.points, (p) => { return (p * factor) }));
        let normals = Float32Array.from(_.map(shellJSON.normals, (n) => { return (n * factor) }));

        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
        let colors = Float32Array.from(this._faceload(shellJSON.faces));
        geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Compute bbox
        geometry.computeBoundingBox();

        return geometry;
    }
}