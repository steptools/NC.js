
### Module structure
+ `file.js` contains code for the file system.
+ `state.js` contains code for looping through the simulation and getting key and delta states.
+ `step.js` contains code for getting information on workingsteps
+ 'geometry.js' contains code for getting information about the geometry of a given project
+ 'projects.js' contains code for getting information about the current projects available
+ 'tool.js' contains code for getting information about the current tools within the given project

### Coding Conventions
+ When in doubt, follow the [Node Style Guide] https://github.com/felixge/node-style-guide
+ [Semicolon usage guide](https://www.codecademy.com/blog/78)
+ Use lower case as much as possible when naming variables. Use CamelCase when necessary. Be sure to capitalize the 'I' in 'Id'.
+ Global variables should begin with an underscore (except finder, apt, machineState, etc).
+ Use CamelCase for functions. Functions called by `app.router.get()` should begin with an underscore.
+ Don't squish functions and statements too much, follow what's already written.

### Endpoint Structure
The endpoint structure of these files

* geometry
	* {uuid}
		* {type}
- state
	* delta
	* key
	- loop
		* {loopstate}
	- ws
		* {command}
- tools
	* {toolID}
- toolpaths
	* {tpID}
- workplans
	* {wpID}
- workingsteps
	- {wsID}

In order to expand these endpoints, the typical notation is property/id/.

### File System and Data Setup
File System is now based on command line arguments and no longer needs data setup. The proper starting command is now

> npm start -- --f [path_to_file]

In order to get the file path for a specific project use:

var file = require('./file'); //This is if the file.js is in the same directory as your .js file
file.tol gets you the Tolerance Object for the server
file.find gets you the Finder Object for the server
file.apt gets you the AptStepMaker Object for the server
file.ms gets you the MachineState Object for the server
