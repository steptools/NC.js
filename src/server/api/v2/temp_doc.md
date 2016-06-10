
### Coding Conventions
+ [Semicolon usage guide](https://www.codecademy.com/blog/78)
+ Use lower case as much as possible when naming variables. Use CamelCase when necessary. Be sure to capitalize the 'I' in 'Id'.
+ Use CamelCase for functions. Functions called by `app.router.get()` should begin with an underscore.

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
