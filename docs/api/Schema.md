# State & Geometry info pseudo schema

Two Types of State: Key and Delta.  
**KeyState** is at /v3/nc/state/key.  

    {
      'project': string,
      'workingstep': uint,
      'time_in_workingstep': 0,
      'geom': geomRef[]
    }

**DeltaState** is at /v3/nc/state/delta  

    {
      'project': string,
      'workingstep': uint,
      'time_in_workingstep': 0,
      'prev: '',
      'geom': geomRef[]
    }

Geom Types have *references* in the State file. They look like:

    {
      'id': uuid,
      geomType: uuid+'.json',
      <'version':uint,>
      'xform': double[16],
      'bbox': double[6],
      'usage': usageStr
    }
    geomType = <'shell','polyline','dynamicShell'>

usageStr are specific to geomType:

    'shell' usageType = <'asis','tobe','removal','cutter','fixture','machine'>
    'polyline' usageType = 'toolpath'
    'dynamicShell' usageType = 'inprocess'

Note that dynamicShell is the only one to include a 'version' property.
**shell** is at /v3/nc/geometry/:id/shell
    
    {
      'id': uuid,
      'faces': face[],
      'precision': int,
      'normalsIndex': int[],
      'pointsIndex': int[],
      'values': int[]
    }
face:

    {
      'count': uint,
      'id': uint,
      'color': double[3]
    }

**polyline** is at /v3/nc/geometry/:id/annotation

    {
      'colorsdata': colorData[],
      'lines': double[][]
    }
colorData:
    
    {
      'duration': uint,
      'data': double[3]
    }

**dynamicShell** is at /v3/nc/geometry/dynamic/:prev

    {
      'id': uuid,
      'version': uint,
      'precision': int,
      'faces': face[],
      'normalsIndex': int[],
      'pointsIndex': int[],
      'values': int[],
      'remove': int[]
    }

