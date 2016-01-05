import React from 'react';
import Menu from 'rc-menu';
var MenuItem = Menu.Item;

export default class SidebarView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    menuSelected(info){
      var menu = info.item.props.select;
    }

    render() {
      const modeMenu = ( <Menu mode='horizontal' onClick={this.menuSelected} className='sidebar-menu'>
          <MenuItem select='tree'>Object Tree</MenuItem>
          <MenuItem select='configure' disabled>Configure</MenuItem>
      </Menu> );
        return <div className="sidebar">
                  {modeMenu}
               </div>;
    }
}
