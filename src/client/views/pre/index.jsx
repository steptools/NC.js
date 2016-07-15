import React from 'react';
import Menu, {Item as MenuItem} from 'rc-menu';
import WorkingstepList from './workingstepslist';
import WorkplanList from './workplanlist';
import ToolList from './toollist';
import ToleranceList from './tolerancelist';
import PropertiesPane from './propertiespane';
import ReactTooltip from 'react-tooltip';
import cadManager from '../../models/cad_manager';

render()
{
      return (
      <div id='cadview-container' style={cadview_style}>
        <CADView
            manager={this.props.app.cadManager}
            openProperties={this.openProperties}
            viewContainerId='primary-view'
            root3DObject={this.props.app._root3DObject}
            guiMode={this.state.guiMode}
            resize={this.state.resize}
      />
    </div>
    );
}
