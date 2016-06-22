/* Copyright G. Hemingway, 2015 - All rights reserved */
"use strict";

import React                from 'react';
import ReactDOM             from 'react-dom';
import request              from 'superagent';
import ResponsiveView       from './views/responsive';
let qs                      = require('qs');
const queryString =         require('query-string');

/*************************************************************************/

module.exports = Backbone.Router.extend({
    routes: {
        '':                             '_landing',
        'stepnc/:projectid':            '_stepnc',
        ':modelID':                     '_model',
        '*path':                        '_default',
    },
    initialize: function(options) {
        this.app = options.app;
    },

    _landing: function() {
        console.log('Landing path');
    },

    _model: function(modelID, query) {
        query = queryString.parse(query);
        let self = this;
        // Render the root CAD view
        ReactDOM.render(<CADView
            manager={this.app.cadManager}
            viewContainerId='primary-view'
            root3DObject={this.app._root3DObject}
        />, document.getElementById('primary-view'), function () {
            // Dispatch setModel to the CADManager
            self.app.cadManager.dispatchEvent({
                type: 'setModel',
                path: modelID,
                baseURL: self.app.services.api_endpoint + self.app.services.version,
                modelType: query.type
            });
        });
    },

    _stepnc: function(pid){
        let self = this;
        
        let url = "/v2/nc/projects/";
        
        let requestCB = function(error, response) {
            if (!error && response.ok) {
                let projectList = JSON.parse(response.text);
                    
                    if (projectList[pid] !== undefined) {
                        // project exists, render view
                        ReactDOM.render(
                        <div style={{ height:'100%'}}>
                            <ResponsiveView
                                app = {self.app }
                                pid = {pid}
                                />
                        </div>
                        , document.getElementById('primary-view'), function () {
                            // Dispatch setModel to the CADManager
                        });
                         
                        pid = 'projects/' + pid;
                        self.app.cadManager.dispatchEvent({
                            type: 'setModel',
                            path: pid + '/state/key',
                            baseURL: self.app.services.api_endpoint + self.app.services.version,
                            modelType: 'nc'
                        });
                        
                    }
                    else {
                        // display an error message
                        ReactDOM.render(
                            <div style={{width:'100%'}}>
                                <h1>Error 404: project '{pid}' not found.</h1>
                            </div>
                        , document.getElementById('primary-view'), function() {});            
                    }
            }
        };
        
        requestCB = requestCB.bind(this);
        
        request.get(url).end(requestCB);

    },

    /************** Default Route ************************/

    _default: function(path) {
        console.log('Landed on default path ' + path);
    }
});
