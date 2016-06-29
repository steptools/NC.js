NC.js


Setting up a development environment
====================================

  1. Download and build STEPNode

  ```
  > git clone https://github.com/steptools/STEPNode.git
  > cd STEPNode
  > npm install
  ```

  ------------------------------------------------------------------------------
  2. Clone NC.js into the same directory that contains the STEPNode
      directory, E.G.:

  ```
  > cd ..
  > git clone https://github.com/steptools/STEPNode.git
  > ls
  STEPNode      NC.js
  ```

  ------------------------------------------------------------------------------
  3. create a new directory in NC.js

  ```
  > cd NC.js
  > mkdir data
  ```

  ------------------------------------------------------------------------------
  4. create a new directory in data for each project

  ```
  > cd data
  > mkdir boxy
  > mkdir moldy
  ```

  ------------------------------------------------------------------------------
  5. Place the projects .stpnc file in the new directory under the name
      model.stpnc

  ```
  > cd boxy
  > cp ~/Downloads/boxy.stpnc ./model.stpnc
  > cd ../moldy
  > cp ~/Downloads/moldy.stpnc ./model.stpnc
  ```

  ------------------------------------------------------------------------------
  6. Create a file named pathmap.json in the data directory that contains a json
      object that contains each project name as a key and path as a value.

  ```
  > cd ..
  > nano pathmap.json
  {
    "boxy" : "c:/.../stepncviewer/data/boxy/model.stpnc",
    "moldy" : "c:/.../StepNCViewer/data/moldy/model.stpnc"
  }
  ```

  ------------------------------------------------------------------------------
  7. Create a key

  ```
  > cd ..
  > ssh-keygen -t rsa -f config/id_rsa
  ```
 
 ------------------------------------------------------------------------------
  8. Install Glyphicons

  ```
  > cd src/client
  > cp ~Downloads/fonts ./fonts
  ```

  ------------------------------------------------------------------------------
  9. Install nodejs packages

  ```
  > npm install
  ```
 ------------------------------------------------------------------------------
  10. Making a server

  Making a server will build and then start the server

  ```
  > npm run make
  ```

  or, to minimize the file sizes

  ```
  > npm run make-release
  ```
  ------------------------------------------------------------------------------
 

 Start a server

  If a server doesn't need to be rebuilt, this will be faster than making everytime. 

  ```
  > npm start
  ```
 
