# Workplan Endpoint


**Address**: http://\<server\>/v3/nc/workplan[/{id}]  
**Definition**: [step.js](https://github.com/steptools/NC.js/blob/master/src/server/api/v3/step.js)  

The Workplan root endpoint returns the tree of Executables.  

**Executable:**  

    {
      'id': string,
      'name': string,
      'type': string,
      'baseTime': double,
      'timeUnits': string,
      'distance': double,
      'distanceUnits': string,
      'setupID': int,
      'asIs': workpieceref,
      'toBe': workpieceref,
      'delta': workpieceref,
      'children': Executable[],
      'enabled':bool
    }

Property | Unit | Description
---|---|---
id |string|The unique identifier for the Executable.
name |string|The executable's name, if any.
type|string|The specific type of the executable. See below.
baseTime|double|The expected amount of time to complete this operation (and its children, if any).
timeUnits|string|The unit of baseTime. Usually Seconds?
distance|double|The total length the tool moves in this operation (and its children, if any).
distanceUnits|string|The name of the units the distance property is measured in.
setupID|int|The ID of the setup this executable is in. (The setup endpoint just returns the setup ID. This should become a UUID by the time a proper setup endpoint is made.)
asIs|[workpieceref](Workpiece-Reference.md)|A reference to the As Is (Initial) workpiece for this executable
toBe|[workpieceref](Workpiece-Reference.md)|A reference to the To Be (Final) workpiece for this executable
delta|[workpieceref](Workpiece-Reference.md)|A reference to the delta (Removed) workpiece for this executable
children|Executable[]|An array of Executables beneath this one in the workplan.
enabled|bool|Whether or not this Executable is Enabled. If false, all children should also be disabled.

**type** will be one of `Nc Function` `workingstep` `selective` `workplan` `workplan-setup`  
A leaf node of the Executable tree will be of type `Nc Function` or `workingstep`  

Executables of type `workingstep` have additional properties:  

**Workingstep**  

    {
      tool: string,
      feedRate: double,
      feedUnits: string,
      speed: double,
      speedUnits:string
    }

Property | Unit | Description
---|---|---
tool|string|The ID for the tool this workingstep uses. See [Tool Endpoint]().
feedRate|double|The rate which the tool moves for this workingstep.
feedUnits|string|The unit feedRate is in.
speed|double|The spindle speed for this workingstep.
speedUnits|string|The unit speed is in.
