
### Module structure
+ `file.js` contains code for the file system.
+ `state.js` contains code for looping through the simulation and getting key and delta states.
+ `step.js` contains code for getting information on workingsteps

### Coding Conventions
+ [Semicolon usage guide](https://www.codecademy.com/blog/78)
+ Use lower case as much as possible when naming variables. Use CamelCase when necessary. Be sure to capitalize the 'I' in 'Id'.
+ Global variables should begin with an underscore (except finder, apt, machineState, etc).
+ Use CamelCase for functions. Functions called by `app.router.get()` should begin with an underscore.
+ Don't squish functions and statements too much, follow what's already written.

### Endpoint Structure
The endpoint structure of these files
+ projects
	- projectID
		* geometry
			+ {type}
				+ {eid}
		* state
			+ deltastate
			* keystate
		* tools
			+ {toolID}
		* toolpaths
			+ {tpID}
		* workplans
			+ {wpID}
		* workingsteps
			+ {wsID}

In order to expand these endpoints, the typical notation is property/id/.
