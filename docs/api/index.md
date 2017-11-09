# API Endpoints

[Workplan](Workplan-Endpoint.md)  
[Keystate](Keystate-Endpoint.md)  
//[Deltastate](Deltastate-Endpoint.md)  
[Shell Geometry](Shell-Geometry-Endpoint.md)  
//[Polyline Geometry]()  
//[DynamicShell Geometry]()  
//[Tool]()  

[Older API documentation, may be outdated](older.md)

# Data Structures

[Face](Face-Reference.md)  
[Geometry](Geometry-Reference.md)  
[Workpiece](Workpiece-Reference.md)  
[State & Geometry info pseudo schema](Schema.md)

# Server Client Communication

Initial connect:  

1. Server sends client to browser. Client establishes websocket connection to be notified on updates.
2. Client requests /v3/nc/state/key (see [Pseudo-Schema](State-&-Geometry-info-pseudo-schema))  [Code in data_loader.js](https://github.com/steptools/NC.js/blob/master/src/client/models/data_loader.js#L361)
3. Client parses keystate [see Client ApplyDelta logic](Client-ApplyDelta-logic) / [Code in data_loader.js](https://github.com/steptools/NC.js/blob/mtconnectstepnode2.0.0/src/client/models/data_loader.js#L365)

On change (tool movement):

1. Server sends {'nc:delta',...} object over websocket. [Code in state.js](https://github.com/steptools/NC.js/blob/NewDeltas/src/server/api/v3/state.js#L73)
2. Client parses state [see Client ApplyDelta logic](Client-ApplyDelta-logic) / [Code in cad_manager.js](https://github.com/steptools/NC.js/blob/master/src/client/models/cad_manager.js#L151)

# Client ApplyDelta logic

On receipt of a [Key/Delta]State, the client invokes the [applyDelta function in nc.js](https://github.com/steptools/NC.js/blob/master/src/client/models/nc.js#L221)

1. Hide any geometry currently displayed
2. Call the [dynamicShell handler](https://github.com/steptools/NC.js/blob/NewDeltas/src/client/models/nc.js#L265), which attempts to update the dynamic shell if necessary (if newversion > currentversion).
3. Display any requested geometry which is in our local cache
4. Queue geometry loads from server for geometry which is not in local cache
