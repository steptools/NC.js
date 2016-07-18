/* G. Hemingway Copyright @2015
 * Manage the drawing context/canvas as a React View
 */

"use strict";


let _                   = require('lodash');
import React            from 'react';
import ViewerControls   from './viewer_controls';
import CompassView      from '../compass/compass';
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
        onClick={this.props.alignCb}
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
            modelTree: {},
            isViewChanging: false,
            lastHovered: undefined,
            lockedView: true,
            oldColors: {}
        };
    }

    componentDidMount() {
    }

    render() {
      return <div id='cadjs-container'>
          <GeometryView manager={this.props.manager} selectedEntity={this.props.selectedEntity} guiMode={this.props.guiMode}/>
          <ViewButton
            alignCb={() => {
              this.alignToolView(this.props.manager.getSelected());
              this.invalidate();
            }}
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
