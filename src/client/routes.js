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
        'stepnc/':                      '_stepnc',
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

    _stepnc: function(){
        let self = this;
        
        ReactDOM.render(
            <div style={{ height:'100%'}}>
                <ResponsiveView
                    app = {self.app}
                    />
            </div>
            , document.getElementById('primary-view'), function () {
                // Dispatch setModel to the CADManager
        });

        self.app.cadManager.dispatchEvent({
            type: 'setModel',
            path: 'state/key',
            baseURL: self.app.services.api_endpoint + self.app.services.version,
            modelType: 'nc'
        });

    },

    /************** Default Route ************************/

    _default: function(path) {
        console.log('Landed on default path ' + path);
    }
});
