/* G. Hemingway Copyright @2015
 * Manage the drawing context/canvas as a React View
 */

"use strict";


let _                   = require('lodash');
import React            from 'react';
import ViewerControls   from './viewer_controls';
import LoadQueueView    from '../load_queue';
import GeometryView     from '../geometry';

// Import shaders
require('./shaders/VelvetyShader');


/*************************************************************************/

class ViewButton extends React.Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    let icon = "unlock";
    if (this.props.locked)
      icon = "lock";
    
    return <div className="resetview">
      <span
        className={"glyphicons glyphicons-eye-open" + (this.props.locked ? ' locked' : '')}
        onClick={() => {}/*this.props.alignCb*/}
      />
      <span
        className={"lock glyphicons glyphicons-" + icon + (this.props.locked ? ' locked' : '')}
        onClick = {this.props.toggleLock}
      />
    </div>;
  }
}

/*************************************************************************/

export default class CADView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isViewChanging: false,
            lastHovered: undefined,
            lockedView: true,
            oldColors: {}
        };
    }

    // Handle all object selection needs
    handleSelection(obj, event) {
      let change = false, flip = false;
      let selected = this.props.manager.getSelected();
      // Toggle selection if already selected
      if (obj && selected.length === 1 && selected[0].getID() === obj.getID()) {
          flip = true;
      }
      // Allow meta for multi-selection
      if (!event.metaKey && !flip) {
          // Clear all currently selected objects
          this.props.manager.clearSelected(selected);
          change = true;
      }
      // Did we find an object
      if (obj) {
          obj = obj.getNamedParent();
          // Toggle the bounding box
          obj.toggleSelection();
          change = true;
      }
      if (change) {
          this.invalidate();
      }
    }

    componentDidMount() {
    }

    render() {
      return <div id='cadjs-container'>
          <GeometryView manager={this.props.manager} selectedEntity={this.props.selectedEntity} guiMode={this.props.guiMode}/>
          <ViewButton
            /*alignCb={() => {
              this.alignToolView(this.props.manager.getSelected());
              this.invalidate();
            }}*/
            toggleLock={() => {this.setState({'lockedView': !this.state.lockedView});}}
            locked = {this.state.lockedView}
          />
          <LoadQueueView dispatcher={this.props.manager} guiMode={this.props.guiMode} />
      </div>;
    }
};

CADView.propTypes = {
    manager: React.PropTypes.object.isRequired
};
