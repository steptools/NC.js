# NC.js

NC.js is the Web interface for the Digital Thread.  This implement a
rich REST API for process and models as well as a matching client that
displays the 3D part models for machining workpiece, tools, CNC, as
well as removal simulation, PMI annotations, MTConnect positional
data, QIF face status, and other aspects of a Digital Twin on the
Digital Thread.

This software Javascript under the Apache license, so that you can
customize the client and REST API as desired.  On the server, the REST
API uses the STEPNode native Node.js wrapper for the STEP Tools
commercial technology stack, which handles STEP and STEP-NC
read/write, analysis, geometry manipulation, and material removal
simulation.

 - [NC.js Documentation](docs/index.md)

![Screenshot](docs/images/fishhead.png "NC.js Screenshot")


## Getting Started

1. Download NC.js:

```
> git clone https://github.com/steptools/NC.js.git
> cd NC.js
```

------------------------------------------------------------------------------
2. Install node packages

```
> npm install
```

------------------------------------------------------------------------------
3. Specify the Digital Thread Model


The config.js file contains the name of the STEP-NC file to use.  You can find sample files at http://www.ap238.org/  

Update the "file" object and "dir" key with the file that the server should display.

```
"file" : {"dir": "path_to_file.stpnc"} 
```

------------------------------------------------------------------------------
4. Build and start a server

In the root NC.js directory, build and start the sever as follows:

```
> npm run make

> npm run make-release      # same, but minimizes file sizes
```

If the server has already been built, you can start it as follows.
This will be faster than making everytime.

```
> npm start
```

The `config.js` file contains the path to the STEP model.   You can override the value and specify a STEP model on the command line as follows. 

 ```
> npm start -- -f "path_to_file.stpnc"
```
------------------------------------------------------------------------------
5. Open Client

With the server running, point a web browser to

```
http://localhost:8080/
 ```
