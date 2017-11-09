# Shell Geometry Endpoint

In API v4 the geometry endpoints will move to /[type]/[id] instead of /[id]/[type]  
**Address**: http://\<server\>/v3/nc/geometry/{id}/shell  
**Definition**: [geometry.js](https://github.com/steptools/NC.js/blob/master/src/server/api/v3/geometry.js)  

The Shell Geometry endpoint provides a full shell for the given ID.  

**Shell**:

    {
      'id': string,
      'faces': faceref[],
      'precision': int,
      'normals': int[],
      'points': int[]
    }

Property|Unit|Description
---|---|---
id|string| The unique identifier for the Shell.
faces|[faceref](Face-reference.md)[]| Set of face information for the Shell.
precision|int| Power-of-ten applied to normal/point arrays?
normals|int[]| Ask Joe to explain
points|int[]| Ask Joe to explain
