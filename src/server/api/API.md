# API Endpoints

/v2/nc is appended to the beginning of all endpoints

### *Found in state.js*

> **/projects/{ncId}/state/key**

Returns the current keystate for the project defined by ncId

> **/projects/{ncId}/state/delta**

Returns the current delta state for the project defined by ncId\

> **/projects/{ncId}/state/loop/**

Returns the current state for the project (e.g. play or pause) defined by ncId

> **/projects/{ncId}/state/loop/{loopstate}**

For loopstate the options are as follows:

 - start : starts the simulation
 - stop : stops the simulation
 - {int} : changes the speed of the simulation

> **/projects/{ncId}/state/ws/{command}**

For command the options are as follows:

 - next : moves the simulation to the next workingstep
 - prev : moves the simulation to the previous workingstep
 - {int} : moves the simulation to a specific workingstep defined by the int 

### *Found in projects.js*

> **/projects/**

Returns a list of projects that are in pathmap.json

### *Found in geometry.js*

> **/projects/{ncId}/geometry**

Returns a list of geometry in JSON format for the given ncId

> **/projects/{ncId}/geometry/{uuid}/{type}**

Returns a JSON format geometry information for the given ncId with uuid and type given

### *Found in step.js*

> **/projects/{ncId}/workplan/{wsId}**

Returns the workingstep in JSON format for the project specified by ncId and workingstep specified by wsId

> **/projects/{ncId}/workplan**

Returns the main workplan in JSON format for the given project by ncId

### *Found in tool.js*

> **/projects/{ncId}/tools

Returns a list of tools for the project specified by ncId

> **/projects/{ncId}/tools/{toolId}

Returns the tool information for the tool specified by toolId