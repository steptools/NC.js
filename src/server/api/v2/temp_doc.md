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
			+ {uuid}
				+ {type}
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


Must setup a data folder in the root directory that contains a pathmap.json file with example structure:
{
	"<ncId>": "<path>"
}
ncId should be replaced with the ncId of the project e.g. "boxy" and should always be all lower case letters
path should be replaced with the path to the .stpnc file within the data directory e.g "C:/Users/Nick/Documents/STEP Tools/StepNCViewer/data/boxy/model.stpnc"

In order to get the file path for a specific project use:

var file = require('./file'); //This is if the file.js is in the same directory as your .js file
file.getPath(ncId) //This will give you the absolute path for the given ncId based on the pathmap.json