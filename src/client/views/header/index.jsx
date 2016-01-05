import React from 'react';
import Menu from 'rc-menu';
var SubMenu = Menu.SubMenu;
var MenuItem = Menu.Item;

class ButtonImage extends React.Component{
  constructor(props){
    super(props);
  }
  render(){
    var classes = 'button-icon glyphicon glyphicon-' + this.props.icon;
    return <div className={classes}/>;
  }
}

export default class HeaderView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {'openMenu': 'file-menu'};
        this.openBottomMenu = this.openBottomMenu.bind(this);
    }

    openBottomMenu(info){
      this.setState({ 'openMenu' : info.item.props.select });
      console.log(this.state);
    }

    render() {
        const topMenu = ( <Menu mode='horizontal' onClick={this.openBottomMenu} className='top-menu'>
            <MenuItem select='file-menu'>File</MenuItem>
            <MenuItem select='simulate-menu'>Simulate</MenuItem>
            <MenuItem select='debug-menu'>Debug</MenuItem>
        </Menu> );
        const bottomMenu = ( <div className='bottom-menus'>
          {this.state.openMenu == 'file-menu' ?
          <Menu mode='horizontal' className='bottom-menu'>
              <MenuItem><ButtonImage icon='file'/>New</MenuItem>
              <MenuItem><ButtonImage icon='save'/>Save</MenuItem>
              <MenuItem><ButtonImage icon='open-file'/>Load</MenuItem>
          </Menu> : null }
          {this.state.openMenu == 'simulate-menu' ?
          <Menu mode='horizontal' className='bottom-menu'>
              <MenuItem><ButtonImage icon='backward'/>Prev</MenuItem>
              <MenuItem><ButtonImage icon='play'/>Play</MenuItem>
              <MenuItem><ButtonImage icon='forward'/>Next</MenuItem>
          </Menu> : null}
          {this.state.openMenu == 'debug-menu' ?
          <Menu mode='horizontal' className='bottom-menu'>
              <MenuItem><ButtonImage icon='fire'/>Action 1</MenuItem>
              <MenuItem><ButtonImage icon='fire'/>Action 2</MenuItem>
              <MenuItem><ButtonImage icon='fire'/>Action 3</MenuItem>
              <MenuItem><ButtonImage icon='fire'/>Action 4</MenuItem>
              <MenuItem><ButtonImage icon='fire'/>Action 5</MenuItem>
              <MenuItem><ButtonImage icon='fire'/>Action 6</MenuItem>
          </Menu> : null}
        </div>);

        return <div className="header-bar">
            <div>{topMenu}</div>
            <div>{bottomMenu}</div>
        </div>;
        // return <div className="header-bar">
        //             <TabMenu>
        //                 <FileMenu disabled=true />
        //             </TabMenu>
        //             <ButtonMenu>
        //                 <ButtonGroup name="Begin">
        //                     <Button name="Load File"/>
        //                 </ButtonGroup>
        //             </ButtonMenu>
        //        </div>;
    }
}
