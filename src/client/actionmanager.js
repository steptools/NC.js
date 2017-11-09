/* 
 * Copyright (c) 2016-2017 by STEP Tools Inc. 
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
/*
  Action Manager for Global Application Actions

  For example, "open-sidebar", "load-file"
*/

let LOG_ALL_ACTIONS = false;

if (LOG_ALL_ACTIONS) {
  console.info(
    `
    The action manager is currently set to log all messages.

    To disable this setting, set LOG_ALL_ACTIONS to false in actionmanager.js
    `
  );
}


const EventEmitter = require('events');

class ActionManager extends EventEmitter {
  constructor() {
    super();
    this.on('newListener', (event)=>{
      if (LOG_ALL_ACTIONS) {
        console.log('ActionManager : New Listener : ' + event);
      }
    });
  }
}

const actionManager = new ActionManager();

if (LOG_ALL_ACTIONS) {
  let oldEmit = actionManager.emit;
  actionManager.emit = function(event) {
    console.log('ActionManager : Action : ' + event);
    oldEmit.apply(actionManager, arguments);
  };
}
module.exports = actionManager;
