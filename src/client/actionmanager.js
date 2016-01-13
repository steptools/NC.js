/*
  Action Manager for Global Application Actions

  For example, "open-sidebar", "load-file"
*/

var LOG_ALL_ACTIONS = true;

if (LOG_ALL_ACTIONS){
  console.info(`
    The action manager is currently set to log all messages.

    To disable this setting, set LOG_ALL_ACTIONS to false in actionmanager.js
    `);
}


const EventEmitter = require('events');

class ActionManager extends EventEmitter {
  constructor(){
    super();
    this.on("newListener", (event)=>{
      console.log("ActionManager : New Listener : " + event);
    });
  }
}

const actionManager = new ActionManager();

if (LOG_ALL_ACTIONS){
  var oldEmit = actionManager.emit;
  actionManager.emit = function(event, data){
    console.log("ActionManager : Action : " + event);
    oldEmit.apply(actionManager, arguments);
  };
}
module.exports = actionManager;
