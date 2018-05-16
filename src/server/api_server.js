#!/usr/bin/node
/* 
 * Copyright (c) 2016-2017 by STEP Tools Inc. 
 * Copyright G. Hemingway 2015
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */

'use strict';

var http = require('http');
var path = require('path');
var io = require('socket.io');
var ioSession = require('socket.io-express-session');
var expSession = require('express-session');
var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var jade = require('jade');
var CoreServer = require('./core_server');
var EventEmitter = require('events');

/************************* Support Site *********************************/

var COOKIE_SECRET = 'imhotep';
var app;

class APIServer extends CoreServer {
  constructor() {
    super();
    // Setup the session
    this.events = new EventEmitter();
    this.session = expSession({
      cookie: { httpOnly: false },
      secret: COOKIE_SECRET,
      resave: false,
      saveUninitialized: false,
    });
    // Set up the rest
    this.visitors = [];
    this._bindfns = this._bindfns.bind(this);
    this._bindfns();
    this._setExpress();
    this._setSocket();
    this._setRoutes(() => {
      this._setSite();
    });
  }
  _bindfns(){
    this._setExpress = this._setExpress.bind(this);
    this._setSocket = this._setSocket.bind(this);
    this._setRoutes = this._setRoutes.bind(this);
    this._setSite = this._setSite.bind(this);
    this.run = this.run.bind(this);
  }
  /*
   * Setup Express Frontend
   */
  // Calculate sha1 hash of the file object
  _setExpress(){
    this.express = express();
    this.express.disable('x-powered-by');
    // prevents caching in Edge
    this.express.use(function noCache(req, res, next) {
      let browser = req.headers['user-agent'];
      // add browser.includes('rv') for IE
      if (browser.includes('Edge')) {
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.header('Pragma', 'no-cache');
        res.header('Expires', 0);
      }
      next();
    });
    this.express.use(
      require('serve-favicon')
        (__dirname + '/../../public/img/favicon.ico')
    );
    this.express.use(bodyParser.urlencoded({ extended: true }));
    this.express.use(bodyParser.json());
    this.express.use(cookieParser('imhotep'));
    this.express.use(this.session);
    this.express.use(require('method-override')());
    this.express.use(
      require('serve-static')
        (path.join(__dirname, '/../../public'))
    );
    this.express.use(require('morgan')('common'));
    this.express.use(require('compression')());
    this.express.engine('jade', jade.__express);
    this.express.set('views', path.join(__dirname, '/views'));
    // Create the core router
    this.router = express.Router();
    this.express.use(this.router);
  };

  /*
   * Setup the socket server
   */
  _setSocket(){
    // Socket server
    this.server = http.Server(this.express);
    this.ioServer = io(this.server, {});
    this.ioServer.use(ioSession(this.session));
    this.ioServer.on('connection', function (socket) {
      socket.on('disconnect', function () { });
    });
  };

  /*
   * Core API Routes
   */
  _setRoutes(cb){
    require('./api/v3/step')(this, () => {
      require('./api/v3/tool')(this, () => {
        require('./api/v3/tolerances')(this, () => {
          require('./api/v3/geometry')(this, () => {
            require('./api/v3/changelog')(this, () => {
              require('./api/v3/custom')(this, () => {
                if (this.config.mtConnect) {
                  require('./api/v3/MTstate')(this, () => {
                    if (cb) {
                      cb();
                    }
                  });
                } else {
                  require('./api/v3/state')(this, () => {
                    if (cb) {
                      cb();
                    }
                  });
                }
              });
            });
          });
        });
      });
    });
  };

  /*
   * Static Site
   */
  _setSite(){
    var endpoint = '';
    if (this.config.host) {
      endpoint = this.config.protocol + '://' + this.config.host + ':' + app.port;
    }
    var services = {
      apiEndpoint: endpoint,
      socket: '',
      version: '/v3',
      machine: this.machinetool,
    };
    // Serve the root client framework - customized as needed
    var _serveRoot = (req, res) => {
      this.visitors.push({ 'time': Date(), 'ip': req.ip });
      var appConfig = {
        title: 'NC.js',
        source: '/js/main.js',
        services: services,
        config: this.config.client
      };
      res.render('base.jade', appConfig);
    };

    this.router.get('/', _serveRoot);
    this.router.get('/listVisitors', (req, res) => { res.status(200).send(this.visitors) });
    this.router.get('*', function (req, res) {
      res.status(404).send('404 Error: Not Found');
    });
  };

  /*
   * Primary run
   */
  run() {
    this.server.listen(app.port, () => {
      this.logger.info('CAD.js API Server listening on: ' + app.port);
    });


    process.openStdin().addListener('data', (inputData) => {
      if ((this.server !== null) && (this.server !== 'undefined')) {
        inputData = inputData.toString().trim().toLowerCase();
        if (inputData.length === 0) {
          process.exit(0);
        }
      }
    });
  };
}
/***************************** Run the server *********************************/

app = new APIServer();
app.run();