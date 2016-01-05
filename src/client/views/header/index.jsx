import React from 'react';
import Menu from 'rc-menu';
var SubMenu = Menu.SubMenu;
var MenuItem = Menu.Item;

export default class HeaderView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        const topMenu = ( <Menu mode='horizontal' className='top-menu'>
            <MenuItem>File</MenuItem>
            <MenuItem>Simulate</MenuItem>
        </Menu> );
        const bottomMenu = ( <Menu mode='horizontal' className='bottom-menu'>
            <MenuItem>New</MenuItem>
            <MenuItem>Save</MenuItem>
            <MenuItem>Load</MenuItem>
        </Menu> );

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
