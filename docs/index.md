# NC.js Documentation

NC.js is the Web interface for the Digital Thread.  This implements a
rich REST API for process and models as well as a matching client that
displays the 3D part models for machining workpiece, tools, CNC, as
well as removal simulation, PMI annotations, MTConnect positional
data, QIF face status, and other aspects of a Digital Twin on the
Digital Thread.



 - [REST API Description](API.md)
 - [Contents of serialized STEP data](formats.md)
 - [Internal software layout](GettingStarted.md)

## Package Structure

The software is implemented in Javascript under the Apache license, so
the client and REST API may be customized as desired.  On the server,
the REST API is implemented using the STEPNode native Node.js wrapper
for the STEP Tools commercial technology stack, which handles STEP and
STEP-NC read/write, analysis, geometry manipulation, and material
removal simulation.

![Screenshot](images/ncjs_structure.png "NC.js Screenshot")
