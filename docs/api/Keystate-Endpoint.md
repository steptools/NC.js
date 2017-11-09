# Keystate Endpoint

**Address:** http://\<server\>/v3/nc/state/key  
**Definition:** [State.js](https://github.com/steptools/NC.js/blob/master/src/server/api/v3/state.js)  
Returns the most up-to-date 'full scene' with all geometry currently shown.  
**Keystate:**  

    {
      'project': string,
      'workingstep': string,
      'time_in_workingstep': 0,
      'geom': geomRef[]
    }

Property|Unit|Description
---|---|---
Project|string|The name of the project this keystate applies to.
workingstep|string|The ID of the [Workingstep](Workplan-Endpoint.md) this keystate applies to.
time_in_workingstep|N/A|Always 0. Unused property.
geom|[geomRef](Geometry-Reference.md)[]|An array of all the geometry in this scene.
