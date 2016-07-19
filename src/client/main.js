/* Copyright G. Hemingway, 2015 - All rights reserved */
"use strict";

// Necessary modules
require('./stylesheets/base.scss');
require('bootstrap-webpack');
let io              = require('socket.io-client'),
    jwtDecode       = require('jwt-decode'),
    actionManager   = require('./actionmanager');
import CADManager from './models/cad_manager';
import React                from 'react';
import ReactDOM             from 'react-dom';
import ResponsiveView       from './views/responsive';

/*************************************************************************/

class CADApp extends THREE.EventDispatcher {
    constructor() {
        super();
        let $body = $('body');
        this.services = $body.data('services');
        this.config = $body.data('config');
        
        // Setup socket
        this.socket = undefined;
        if (this.config.socket) {
            // Establish socket connection
            let socketURL = this.services.api_endpoint + this.services.socket;
            this.socket = io(socketURL, {});
            // Connect to the socket server
            this.socket.on('connect', function () {
                console.log('Socket client connected');
            });
        }
        // Create data manager
        this.cadManager = new CADManager(this.config, this.socket,this);

        // Create application-level action manager
        this.actionManager = actionManager;

        // Initialize views
        $body.toggleClass('non-initialized');
        // Initialize the views and dispatch the event to set the model
        ReactDOM.render(
            <div style={{ height:'100%'}}>
                <ResponsiveView
                    app = {this}
                    />
            </div>
            , document.getElementById('primary-view'), function () {
                // Dispatch setModel to the CADManager
        });

        this.cadManager.dispatchEvent({
            type: 'setModel',
            path: 'state/key',
            baseURL: this.services.api_endpoint + this.services.version,
            modelType: 'nc'
        });
    }
}

/*************************************************************************/

// Invoke the new app
module.exports = new CADApp();
