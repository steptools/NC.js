import React from 'react';
import Menu from 'rc-menu';
var MenuItem = Menu.Item;

export default class SidebarView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          'mode': 'tree'
        };
        this.modeSelected = this.modeSelected.bind(this);
    }

    modeSelected(info){
      var mode = info.item.props.select;
      this.setState({mode: mode})
    }

    render() {
      const modeMenu = ( <Menu mode='horizontal' onClick={this.modeSelected} className='sidebar-menu'>
          <MenuItem select='tree'>Object Tree</MenuItem>
          <MenuItem select='configure' disabled>Configure</MenuItem>
      </Menu> );
        return <div className="sidebar">
                  {modeMenu}
                  {this.state.mode == 'tree' ?
                  <div className='tree-view'></div>
                  : null}
                  {this.state.mode == 'configure' ?
                  <div className='configure-view'></div>
                  : null}
               </div>;
    }
}
