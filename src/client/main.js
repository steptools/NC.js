/* 
 * Copyright (c) 2016-2017 by STEP Tools Inc. 
 * Copyright G. Hemingway, 2015
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

// Necessary modules
require('./stylesheets/base.scss');
require('bootstrap-webpack');
let actionManager = require('./actionmanager');
import CADManager from './models/cad_manager';
import ResponsiveView from './views/responsive';

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
      let socketURL = this.services.apiEndpoint + this.services.socket;
      this.socket = io(socketURL, {});
      // Connect to the socket server
      this.socket.on('connect', function () {
        console.log('Socket client connected');
      });
    }

    // Create application-level action manager
    this.actionManager = actionManager;

    // Create data manager
    this.cadManager = new CADManager(this.config, this.socket,this);
    this.cadManager.dispatchEvent({
      type: 'setModel',
      viewType: 'cadjs',
      path: 'state/key',
      baseURL: this.services.apiEndpoint + this.services.version,
      modelType: 'nc',
    });

    // Initialize views
    $body.toggleClass('non-initialized');

    // Initialize the views and dispatch the event to set the model
    let view = (
      <div style={{height:'100%'}}>
        <ResponsiveView
          app = {this}
        />
      </div>
    );

    ReactDOM.render(
      view,
      document.getElementById('primary-view'), function () {
        // Dispatch setModel to the CADManager
      }
    );
  }
}

/*************************************************************************/

// Invoke the new app
module.exports = new CADApp();
