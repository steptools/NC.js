import React from 'react';
import Tree from 'react-ui-tree';
import Menu from 'rc-menu';
import WorkingstepList from './workingstepslist';
import WorkplanList from './workplanlist'
import ReactTooltip from 'react-tooltip';
import cadManager from '../../models/cad_manager'
let MenuItem = Menu.Item;
let scrolled=false;

export default class SidebarView extends React.Component {
    constructor(props) {
        super(props);
        this.state = { };

        this.openObjectTree = this.openObjectTree.bind(this);

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

        this.props.actionManager.on('change-workingstep', updateWorkingstep);
    }

    componentDidMount(){
    }

    openObjectTree(){
        this.props.cbMode('tree');
    }

    render() {
      // TODO currently mode menu can only have two layers
      let nested = this.props.mode != "tree";
      const modeMenu = (
        <div className='sidebar-menu-tabs'>
          <span style={{opacity:nested ?.5:0}} className='glyphicons glyphicons-menu-left back-button'></span>
          <div style={{opacity:nested?.5:1, left:nested?40:140}} onClick={this.openObjectTree} className='back'>
            {this.props.mode === 'tree' ?
              <div>Workplan</div>
              :null
            }
            {this.props.mode === 'ws' ?
              <div>Workingsteps</div>
              :null
            }
          </div>
          <div style={{left:nested?200:400}} className='current'>
            {this.props.altmenu}
          </div>
        </div>
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
               </div>;
    }
}

SidebarView.propTypes = {cadManager: React.PropTypes.instanceOf(cadManager).isRequired, mode : React.PropTypes.string.isRequired, 
                          ws: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]).isRequired,
                          cbMode: React.PropTypes.func.isRequired, cbTree: React.PropTypes.func.isRequired, cbWS: React.PropTypes.func.isRequired, 
                          cbAltMenu: React.PropTypes.func.isRequired, pid: React.PropTypes.string.isRequired};
