import React from 'react';
import Tree from 'react-ui-tree';
import Menu from 'rc-menu';
import WorkingstepList from './workingstepslist';
import WorkplanList from './workplanlist';
import ToleranceList from './tolerancelist';
import ReactTooltip from 'react-tooltip';
import cadManager from '../../models/cad_manager';
let MenuItem = Menu.Item;
let scrolled=false;

export default class SidebarView extends React.Component {
    constructor(props) {
        super(props);
        this.state = { };

        let disabledView = (name) => {
          return (() => {
            this.props.cbMode("disabled");
            this.props.cbAltMenu(name);
          }).bind(this);
        };

        let self = this;
        let updateWorkingstep = (state) => {
            self.props.cbWS(state);
            return;
        };

        this.selectMenuItem = this.selectMenuItem.bind(this);

        this.props.actionManager.on('change-workingstep', updateWorkingstep);
    }

    componentDidMount(){
    }

    selectMenuItem (info) {
        this.props.cbMode(info.key);

        let item = $(info.domEvent.target);
        let menu = $(".sidebar-menu");
        let menutabs = $(".sidebar-menu-tabs");

        let item_left = Number(item.offset().left);
        let item_width = Number(item.outerWidth(true));
        let menu_left = Number(menu.offset().left);
        let menu_width = Number(menu.outerWidth(true));

        let shouldScrollLeft =  item_left < menu_left;
        let shouldScrollRight = item_left + item_width > menu_left + menu_width;

        let offset = menutabs.scrollLeft() + item_left - menu_left;
        if (shouldScrollRight)
            offset = menutabs.scrollLeft() + ((item_left + item_width) - (menu_left + menu_width));

        if (shouldScrollLeft || shouldScrollRight) {
            menutabs.animate({
                scrollLeft: offset
            }, 250);
        }
    }

    render() {
      // TODO currently mode menu can only have two layers
      let nested = this.props.mode != "tree";

      const modeMenu = (
          <Menu onSelect={this.selectMenuItem}
                defaultSelectedKeys={[this.props.mode]}
                mode='horizontal'
                className='sidebar-menu-tabs'>
              <MenuItem key='ws' id='sidebar-menu-ws' >Workingsteps</MenuItem>
              <MenuItem key='tree' id='sidebar-menu-tree' >Workplan</MenuItem>
              <MenuItem disabled key='tools' id='sidebar-menu-tools' >Tools</MenuItem>
              <MenuItem key='tolerance' id='sidebar-menu-tolerance'>Tolerances</MenuItem>
          </Menu>
      );
      if((!scrolled) && (this.props.ws > -1))
      {
        if(document.getElementById(this.props.ws) != null)
        {
          $('.m-tree').animate({
          scrollTop: $("#"+this.props.ws).offset().top-$(".m-tree").offset().top
          }, 1000);
          scrolled=true;
        }
      }
        return <div className="sidebar">
                  {modeMenu}
                  {this.props.mode == 'ws' ?
                      <WorkingstepList pid = {this.props.pid} cbMode = {this.props.cbMode} cbTree = {this.props.cbTree} ws = {this.props.ws}/>
                      : null}
                  {this.props.mode == 'tree' ?
                      <WorkplanList pid = {this.props.pid} cbMode = {this.props.cbMode} cbTree = {this.props.cbTree} ws = {this.props.ws}/>
                      : null}
                  {this.props.mode == 'tolerance' ?
                      <ToleranceList pid = {this.props.pid} cbMode = {this.props.cbMode} cbTree = {this.props.cbTree}  />
                      : null}
               </div>;
    }
}

SidebarView.propTypes = {cadManager: React.PropTypes.instanceOf(cadManager).isRequired, mode : React.PropTypes.string.isRequired,
                          ws: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]).isRequired,
                          cbMode: React.PropTypes.func.isRequired, cbTree: React.PropTypes.func.isRequired, cbWS: React.PropTypes.func.isRequired,
                          cbAltMenu: React.PropTypes.func.isRequired, pid: React.PropTypes.string.isRequired};
