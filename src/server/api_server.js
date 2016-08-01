/* Copyright G. Hemingway 2015 */
'use strict';
const {app, BrowserWindow} = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600});

  // and load the index.html of the app.
  win.loadURL(`http://localhost:8080`);

  // Open the DevTools.
  win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
});

var http = require('http');
var path = require('path');
var io = require('socket.io');
var ioSession = require('socket.io-express-session');
var expSession = require('express-session');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var jade = require('jade');
var CoreServer = require('./core_server');
var util = require('util');
var fs = require('fs');

/************************* Support Site *********************************/

var COOKIE_SECRET = 'imhotep';
var appp;

function APIServer() {
  CoreServer.call(this);
  // Setup the session
  this.session = expSession({
    cookie: {httpOnly: false},
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
  });
  // Set up the rest
  this._setExpress();
  this._setSocket();
  var self = this;
  this._setRoutes(function() {
    self._setSite();
  });
}
util.inherits(APIServer, CoreServer);

/*
 * Setup Express Frontend
 */
// Calculate sha1 hash of the file object
APIServer.prototype._setExpress = function() {
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
  this.express.use(bodyParser.urlencoded({extended: true}));
  this.express.use(bodyParser.json());
  this.express.use(cookieParser('imhotep'));
  this.express.use(this.session);
  this.express.use(require('method-override')());
  this.express.use(
    require('serve-static')
    (path.join(__dirname, '/../../public'))
  );
  this.express.use(require('morgan')('tiny'));
  this.express.engine('jade', jade.__express);
  this.express.set('views', path.join(__dirname, '/views'));
  // Create the core router
  this.router = express.Router();
  this.express.use(this.router);
};

/*
 * Setup the socket server
 */
APIServer.prototype._setSocket = function() {
  // Socket server
  this.server = http.Server(this.express);
  this.ioServer = io(this.server, {});
  this.ioServer.use(ioSession(this.session));
  this.ioServer.on('connection', function(socket) {
    socket.on('disconnect', function() {});
  });
};

/*
 * Core API Routes
 */
APIServer.prototype._setRoutes = function(cb) {
  var self = this;
  require('./api/v3/step')(self, function() {
    require('./api/v3/state')(self, function() {
      require('./api/v3/tool')(self, function() {
        require('./api/v3/tolerances')(self, function() {
          require('./api/v3/geometry')(self, function() {
            if (cb) {
              cb();
            }
          });
        });
      });
    });
  });
};

/*
 * Static Site
 */
APIServer.prototype._setSite = function() {
  var self = this;
  var endpoint = '';
  if (this.config.host) {
    endpoint = this.config.protocol + '://' + this.config.host + ':' + appp.port;
  }
  var services = {
    apiEndpoint: endpoint,
    socket: '',
    version: '/v3',
    machine: self.machinetool,
  };
  // Serve the root client framework - customized as needed
  var _serveRoot = function (req, res) {
    var change = fs.readFileSync('CHANGELOG.md', 'utf8');
    var appConfig = {
      title: 'NC.js',
      source: '/js/main.js',
      services: services,
      config: self.config.client,
      changelog: change,
    };
    res.render('base.jade', appConfig);
  };

  this.router.get('/', _serveRoot);
  this.router.get('*', function(req, res) {
    res.status(404).send('404 Error: Not Found');
  });
};

/*
 * Primary run
 */
APIServer.prototype.run = function() {
  var self = this;
  this.server.listen(appp.port, function() {
    self.logger.info('CAD.js API Server listening on: ' + appp.port);
  });


  process.openStdin().addListener('data', function(inputData) {
    if ((self.server !== null) && (self.server !== 'undefined')) {
      inputData=inputData.toString().trim().toLowerCase();
      if (inputData.length === 0) {
        process.exit(0);
      }
    }
  });
};

/***************************** Run the server *********************************/

appp = new APIServer();
appp.run();

const {app, BrowserWindow} = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600});

  // and load the index.html of the app.
  win.loadURL(`http://localhost:8080`);

  // Open the DevTools.
  win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  });
}
