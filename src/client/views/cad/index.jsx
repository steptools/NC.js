/* G. Hemingway Copyright @2015
 * Manage the drawing context/canvas as a React View
 */

"use strict";


let _                   = require('lodash');
import React            from 'react';
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
            lockedView: true,
            oldColors: {},
        };

        this.onMouseUp = this.onMouseUp.bind(this);
        this.lockedCb = this.lockedCb.bind(this);
    }

    // Handle all object selection needs
    handleSelection(obj, event) {
      let change = false, flip = false;
      let selected = this.props.manager.getSelected();
      // Toggle selection if already selected
      if (obj && selected.length === 1 && selected[0].getID() === obj.getID()) {
          flip = true;
      }
      // Did we find an object
      if (obj) {
          obj = obj.model.getNamedParent();
          // Toggle the bounding box
          obj.toggleSelection();
          change = true;
      }
      if (change) {
          this.refs.alignGeomView.invalidate();
      }
    }

    // Handle clicking in the model view for selection
    onMouseUp(event) {
      if (this.props.manager.modelCount() > 0) {
        let obj = this.props.manager.hitTest(this.refs.alignGeomView.camera, event);
        this.handleSelection(obj, event);
      }
    }

    lockedCb(state){
      this.setState({'lockedView' : state});
    }

    render() {
      return <div id='cadjs-container'>
          <GeometryView
            ref={'alignGeomView'}
            manager={this.props.manager}
            selectedEntity={this.props.selectedEntity}
            guiMode={this.props.guiMode}
            onMouseUp={this.onMouseUp}
            locked={this.state.lockedView}
            lockedCb={this.lockedCb}
            resize={this.props.resize}
            toleranceCache={this.props.toleranceCache}
            ws={this.props.ws}
            />
          <ViewButton
            alignCb={() => {
              this.refs.alignGeomView.alignToolView(this.props.manager.getRootModels());
              this.refs.alignGeomView.invalidate();
            }}
            toggleLock={() => {this.setState({'lockedView': !this.state.lockedView});}}
            locked = {this.state.lockedView}
          />
          <LoadQueueView dispatcher={this.props.manager} guiMode={this.props.guiMode} />
      </div>;
    }
};

CADView.propTypes = {
    manager: React.PropTypes.object.isRequired,
};
