/* 
 * Copyright (c) 2016-2017 by STEP Tools Inc. 
 * G. Hemingway Copyright @2015
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
 * Manage the drawing context/canvas as a React View
 */

'use strict';

import LoadQueueView from '../load_queue';
import GeometryView from '../geometry';

// Import shaders
require('./shaders/VelvetyShader');

/*************************************************************************/

class ViewButton extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let icon = 'unlock';
    let locked = '';
    let eye = 'fa-eye';
    if (this.props.locked) {
	icon = 'lock';
	locked = ' locked';
	eye = 'fa-eye-slash';
    }

    return (
      <div className="resetview">
        <span
          className={'fa ' + eye + locked}
          onClick={this.props.alignCb}
        />
        <span
          className={'lock fa fa-' + icon + locked}
          onClick = {this.props.toggleLock}
        />
      </div>
    );
  }
}

/*************************************************************************/

export default class CADView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lockedView: true,
      pickingMode: false,
      oldColors: {},
    };

    this.onMouseUp = this.onMouseUp.bind(this);
    this.lockedCb = this.lockedCb.bind(this);

    this.props.actionManager.on('changeSetup', (arg)=>{
      this.setState({pickingMode: arg});
      this.refs.alignGeomView.coordinateAxes(true);
      if (!arg) {
        this.refs.alignGeomView.highlightPickedFace(null, null);
        this.refs.alignGeomView.outlinePickedFace(null, null);
        this.refs.alignGeomView.coordinateAxes(false);
      }
    });

    this.props.actionManager.on('moveFixture', (arg)=>{
      if (this.movementFixture == undefined) {
        this.movementFixture = this.refs.alignGeomView.workpieceMovement();
        this.props.manager.getRootModel('state/key')._overlay3D.add(this.movementFixture);
      }
      // We have to take into account the THREE.js transform to correctly map workpiece movements
      if (arg.active == 'x') this.movementFixture.translateY(0 - arg.delta);
      else if (arg.active == 'y') this.movementFixture.translateX(arg.delta);
      else if (arg.active == 'z') this.movementFixture.translateZ(arg.delta);
      this.refs.alignGeomView.invalidate();
    });

    this.props.actionManager.on('removeTransparent', ()=>{
      this.props.manager.getRootModel('state/key')._overlay3D.remove(this.movementFixture);
      this.movementFixture = undefined;
    });
  }

  // Handle all object selection needs
  handleSelection(obj) {
    let change = false;
    //let flip = false;
    //let selected = this.props.manager.getSelected();
    // Toggle selection if already selected
    //if (obj && selected.length === 1 && selected[0].getID() === obj.getID()) {
    //  flip = true;
    //}
    // Did we find an object
    if (!obj) {
      return;
    }
    else if (this.state.pickingMode) {
      let face = this.refs.alignGeomView.facePick(obj);
      if (!face) {
        return;
      }
      this.refs.alignGeomView.highlightPickedFace(obj, face);
      this.refs.alignGeomView.outlinePickedFace(obj, face);
      this.props.actionManager.emit('faceSelected', face);
      change = true;
    } 
    else if (obj.object.userData) {
      obj = obj.object.userData.model.getNamedParent();
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
    let obj;
    if (this.props.manager.modelCount() > 0) {
      obj = this.props.manager.hitTest(this.refs.alignGeomView.camera, event);
      this.handleSelection(obj, event);
    }
  }

  lockedCb(state) {
    this.setState({'lockedView' : state});
  }

  render() {
    //console.log('rendering a CADView');
    return (
      <div id='cadjs-container'>
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
          workingstepCache={this.props.workingstepCache}
          highlightedTolerances={this.props.highlightedTolerances}
          parentSelector='#cadjs-container'
          viewType='cadjs'
        />
        <ViewButton
          alignCb={() => {
            let root = this.props.manager.getRootModel('state/key');
            this.refs.alignGeomView.alignToolView(root);
            this.refs.alignGeomView.invalidate();
          }}
          toggleLock={() => {
            this.setState({'lockedView': !this.state.lockedView});
          }}
          locked = {this.state.lockedView}
        />
        <LoadQueueView
          dispatcher={this.props.manager}
          guiMode={this.props.guiMode}
        />
      </div>
    );
  }
};

CADView.propTypes = {
  manager: React.PropTypes.object.isRequired,
};
