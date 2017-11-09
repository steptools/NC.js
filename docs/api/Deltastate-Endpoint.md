# Deltastate Endpoint

**Address:** http://\<server\>/v3/nc/state/delta  
**Definition:** [State.js](https://github.com/steptools/NC.js/blob/master/src/server/api/v3/state.js)  
Returns a scene which has only the geometry which has changed (movement).  
**Deltastate:**  

    {
      'project': string,
      'workingstep': string,
      'time_in_workingstep': 0,
      'prev': string,
      'geom': geomRef[]
    }

Property|Unit|Description
---|---|---
Project|string|The name of the project this keystate applies to.
workingstep|string|The ID of the [Workingstep](Workplan-Endpoint.md) this keystate applies to.
time_in_workingstep|N/A|Always 0. Unused property.
prev|string|The keystate this is based off of.  **Currently unimplemented and always an empty string**
geom|[geomRef](Geometry-Reference.md)[]|An array of the changed geometry.
