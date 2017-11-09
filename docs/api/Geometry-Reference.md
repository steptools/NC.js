# Geometry Reference

**Geometry Reference:**  

    {
      'id': string,
      <'shell': string>,
      <'polyline': string>,
      <'dynamicShell': string>,
      <'version': uint>,
      'xform': double[16],
      'bbox': double[6],
      'usage': string
    }
Property|Unit|Description
---|---|---
id|string|The ID of the referenced geometry.
shell|string|The location of the associated [shell geometry](Shell-Geometry-Endpoint.md).
polyline|string|The location of the associated [polyline geometry]().
dynamicShell|string|The location of the associated [dynamicShell geometry]().
version|uint|The version of the dynamicShell geometry. Only used with dynamicShells.
xform|double[16]|The 4x4 matrix that describes the transform of the associated geometry.
bbox|double[6]|The bounding box of the associated geometry.
usage|string|A string describing the usage of the part. See below.

`shell` `dynamicShell` and `polyline` are mutually exclusive properties.


**usage** depends on **geomType**:  

geomType | usage
---|---
shell | `asis` `tobe` `removal` `cutter` `fixture` `machine`
polyline| `toolpath`
dynamicShell| `inprocess`

