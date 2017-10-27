"use strict";
//gist.github.com/paulkaplan/6513707
let writeFloat = (dataview, offset, float, isLittleEndian) => {
    dataview.setFloat32(offset, float, isLittleEndian);
    return offset + 4;
};
let writeVector = (dataview, offset, vector, isLittleEndian) => {
    offset = writeFloat(dataview, offset, vector.x, isLittleEndian);
    offset = writeFloat(dataview, offset, vector.y, isLittleEndian);
    return writeFloat(dataview, offset, vector.z, isLittleEndian);
};
let writeTri = (dataview, offset, tri, verts, isLittleEndian) => {
    offset = writeVector(dataview, offset, tri.normal, isLittleEndian);
    offset = writeVector(dataview, offset, verts[tri.a], isLittleEndian);
    offset = writeVector(dataview, offset, verts[tri.b], isLittleEndian);
    offset = writeVector(dataview, offset, verts[tri.c], isLittleEndian);
    offset += 2; // unused 'attribute byte count' is a Uint16
    return offset;
};
let compareVertex = (v1, v2) => {
    return ((v1.x === v2.x) && (v1.y === v2.y) && (v1.z === v2.z));
};
// Given a THREE.Geometry, create a STL binary
let geometryToDataView = (geometry) => {
    let tris = geometry.faces;
    let verts = geometry.vertices;
    let isLittleEndian = true; // STL files assume little endian
    tris = _.filter(tris, (t) => { //Remove degenerates.
        return !(compareVertex(verts[t.a], verts[t.b])
            && compareVertex(verts[t.b], verts[t.c]));
    });

    let bufferSize = 84 + (50 * tris.length);
    let buffer = new ArrayBuffer(bufferSize);
    let dv = new DataView(buffer);
    let offset = 0;

    offset += 80; // Header is empty

    dv.setUint32(offset, tris.length, isLittleEndian);
    offset += 4;

    for (let n = 0; n < tris.length; n++) {
        offset = writeTri(dv, offset, tris[n], verts, isLittleEndian);
    }

    return dv;
}

export function saveSTL(fname,geoms){
    for (let i=0;i<geoms.length;i++) {
      let outgeom = new THREE.Geometry()
                              .fromBufferGeometry(geoms[i]);
      let dv = geometryToDataView(outgeom);
      let blob = new Blob([dv], {type: 'application/octet-binary'});
      FileSaver.saveAs(blob, fname+' model' + i + '.stl');
    }
}