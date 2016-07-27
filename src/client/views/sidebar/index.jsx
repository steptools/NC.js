import React from 'react';
import Menu, {Item as MenuItem} from 'rc-menu';
import WorkingstepList from './workingstepslist';
import WorkplanList from './workplanlist';
import ToolList from './toollist';
import ToleranceList from './tolerancelist';
import PropertiesPane from './propertiespane';
import cadManager from '../../models/cad_manager';

export default class SidebarView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {scrolled: false};

    this.selectMenuItem = this.selectMenuItem.bind(this);

    this.props.actionManager.on('change-workingstep', this.props.cbWS);
  }

  selectMenuItem(info) {
    this.props.cbMode(info.key);
    this.setState({'scrolled': false});
  }

  componentDidUpdate() {
    let update = (!this.state.scrolled) && (this.props.ws > -1);
    update = update && (this.props.mode !== 'tolerance');
    if (update) {
      let currElem = $('.running-node');
      if (currElem.length > 0) {
        let tree = $('.m-tree,.treebeard');
        let tOffset = tree.offset().top + tree.innerHeight();
        let cOffset = currElem.offset().top + currElem.outerHeight();
        if (tOffset < cOffset) {
          tree.animate({scrollTop: (cOffset - tOffset)}, 1000);
        }
        this.setState({'scrolled': true});
      }
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
    />;

    const tabs = (
      <Menu
        onSelect={this.selectMenuItem}
        defaultSelectedKeys={[this.props.mode]}
        mode='horizontal'
        className='sidebar-menu-tabs'
      >
        <MenuItem
          key='ws'
          id='sidebar-menu-ws'
          className='ws'
        >
          Workingsteps
        </MenuItem>
        <MenuItem
          key='wp'
          id='sidebar-menu-wp'
          className='wp'
        >
          Workplan
        </MenuItem>
        <MenuItem
          key='tools'
          id='sidebar-menu-tools'
          className='tool'
        >
          Tools
        </MenuItem>
        <MenuItem
          key='tolerance'
          id='sidebar-menu-tolerance'
          className='tolerance'
        >
          Tolerances
        </MenuItem>
      </Menu>
    );

    let currentView = null;
    if (this.props.mode === 'ws') {
      currentView = (
        <WorkingstepList
          cbMode={this.props.cbMode}
          cbTree={this.props.cbTree}
          ws={this.props.ws}
          workingstepCache={this.props.workingstepCache}
          workingstepList={this.props.workingstepList}
        />
      );
    } else if (this.props.mode === 'wp') {
      currentView = (
        <WorkplanList
          cbMode={this.props.cbMode}
          cbTree={this.props.cbTree}
          ws={this.props.ws}
          workplanCache={this.props.workplanCache}
          propertyCb={this.props.openProperties}
        />
      );
    } else if (this.props.mode === 'tolerance') {
      currentView = (
        <ToleranceList
          cbMode={this.props.cbMode}
          cbTree={this.props.cbTree}
          propertyCb={this.props.openProperties}
          toleranceCache={this.props.toleranceCache}
          toleranceList={this.props.toleranceList}
        />
      );
    } else if (this.props.mode === 'tools') {
      currentView = (
        <ToolList
          cbMode={this.props.cbMode}
          cbTree={this.props.cbTree}
          ws={this.props.ws}
          propertyCb={this.props.openProperties}
          toolCb= {(toolList) => {
            this.setState({tools: toolList});
          }}
          tools={this.props.toolCache}
          curtool={this.props.curtool}
        />
      );
    }

    return (
      <div className='sidebar'>
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
