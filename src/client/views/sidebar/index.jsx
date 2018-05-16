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

import Menu, {Item as MenuItem} from 'rc-menu';
import WorkingstepList from './workingstepslist';
import WorkplanList from './workplanlist';
import ToolList from './toollist';
import ToleranceList from './tolerancelist';
import PropertiesPane from './propertiespane';
import cadManager from '../../models/cad_manager';

var scrolled = false;

export default class SidebarView extends React.Component {
  constructor(props) {
    super(props);

    this.selectMenuItem = this.selectMenuItem.bind(this);
  }

  selectMenuItem(info) {
  //  this.props.cbMode(info.key);
  //  scrolled = false;
  }

  componentDidUpdate() {
    let shouldUpdate = !scrolled;
    shouldUpdate = shouldUpdate && this.props.ws > -1;
    shouldUpdate = shouldUpdate && this.props.mode !== 'tolerance';
    shouldUpdate = shouldUpdate && !this.props.isMobile;
    if (!shouldUpdate) {
      return;
    }

    let tree = $('.m-tree,.treebeard');
    let node = $('.running-node');
    if (node.length <= 0) {
      return;
    }

    let tOffset = tree.offset().top + tree.outerHeight();
    let nOffset = node.offset().top + node.outerHeight();
    let scroll = nOffset - tOffset;
    if (scroll > 0) {
      if (scroll >= node.outerHeight()) {
        scroll += tree.outerHeight() / 2;
        scroll -= node.outerHeight() / 2;
      }
      tree.animate({scrollTop: scroll}, 1000);
      scrolled = true;
    }
  }

  render() {
    let properties = <PropertiesPane
      app={this.props.app}
      entity={this.props.selectedEntity}
      previousEntities={this.props.previouslySelectedEntities}
      pid={this.props.pid}
      ws={this.props.ws}
      propertiesCb={this.props.openProperties}
      tools={this.props.toolCache}
      workingsteps={this.props.workingstepCache}
      resize={this.props.resize}
      toleranceCache={this.props.toleranceCache}
      guiMode={this.props.guiMode}
      manager={this.props.cadManager}
      preview={this.props.preview}
      previewCb={this.props.openPreview}
      toggleHighlight={this.props.toggleHighlight}
      highlightedTolerances={this.props.highlightedTolerances}
      isMobile={this.props.isMobile}
      selectEntity={this.props.selectEntity}
      previewEntity={this.props.previewEntity}
      previewEntityCb={this.props.previewEntityCb}
    />;

    const tabs = (
      <Menu
        onSelect={this.selectMenuItem}
        defaultSelectedKeys={[this.props.mode]}
        mode='horizontal'
        className='sidebar-menu-tabs'
      >
        <MenuItem
          key='wp'
          id='sidebar-menu-wp'
          className='wp'
        >
          Workplan
        </MenuItem>
      </Menu>
    );

    let currentView = null;
    if (0) {
      currentView = (
        <WorkingstepList
          cbMode={this.props.cbMode}
          cbTree={this.props.cbTree}
          propertyCb={this.props.openProperties}
          ws={this.props.ws}
          app={this.props.app}
          workingstepCache={this.props.workingstepCache}
          workingstepList={this.props.workingstepList}
          isMobile={this.props.isMobile}
        />
      );
    } else  {
      currentView = (
        <WorkplanList
          cbMode={this.props.cbMode}
          cbTree={this.props.cbTree}
          ws={this.props.ws}
          workplanCache={this.props.workplanCache}
          propertyCb={this.props.openProperties}
          isMobile={this.props.isMobile}
        />
      );
    } 
    let SVWidth;
    let cName = 'sidebar';
    if (this.props.isMobile) {
      SVWidth = {'width': '100%'};
    } else {
      cName += ' notouch';
    }
    return (
      <div className={cName} style={SVWidth}>
        {properties}
        {tabs}
        {currentView}
      </div>
    );}
}

let rp = React.PropTypes;
SidebarView.propTypes = {
  cadManager: rp.instanceOf(cadManager).isRequired,
  mode: rp.string.isRequired,
  ws: rp.oneOfType([rp.string, rp.number]).isRequired,
  cbMode: rp.func.isRequired,
  cbTree: rp.func.isRequired,
  cbWS: rp.func.isRequired,
  cbAltMenu: rp.func.isRequired,
};
