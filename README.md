StepNCViewer
======

Web-based feature-rich browser for StepNC Data

No data samples are provided at this time, so this is unlikely to work for you.  
You probably want to try [Cad.JS](https://github.com/ghemingway/cad.js) instead.

Setting up a development environment
====================================

*Assumes Mac OS X or Linux*

Get the code
------------

    git clone https://github.com/steptools/StepNCViewer
    cd cad.js

Make a place to put cad data
----------------------------

    mkdir data

Move models into `data` directory ([find some samples](docs/readme)).

Install nodejs packages
-----------------------

    npm install

Setup Redis
-----------

Run a [redis](http://redis.io/) server and update [your config file](config/config.json#L6) to use this redis hostname/ip address and port.

Create a key
------------

    ssh-keygen -t rsa -f config/id_rsa

run development server
----------------------

    npm run start-dev

Building
========

Build/compile using webpack:

    # if you installed webpack globally (`npm install webpack -g`)
    webpack

    # if you installed webpack via package dependencies (`npm install`)
    ./node_modules/.bin/webpack

Snazzy Demos
============

*From an older version*

[Live Demo](www.steptools.com/demos/mtc)
