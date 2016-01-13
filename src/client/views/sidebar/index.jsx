import React from 'react';
import Tree from 'react-ui-tree';
import Menu from 'rc-menu';
import LoadProjectView from './loadproject';
import ReactTooltip from 'react-tooltip';
var MenuItem = Menu.Item;

export default class SidebarView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          'mode': 'tree',
          'tree': {
            "name": "No Project Loaded",
            "isLeaf": true
          },
          'altmenu': ''
        };

        this.modeSelected = this.modeSelected.bind(this);
        this.renderNode = this.renderNode.bind(this);
        this.openLoadProjectMenu = this.openLoadProjectMenu.bind(this);

        var self = this;
        this.props.socket.on('modeltree', (items)=>{
          // Node preprocessing
          var nodeCheck = (node)=>{
            node.icon = this.getNodeIcon(node);
            if (!node.children) node.leaf = true;
            else node.children.forEach(nodeCheck);
          }
          nodeCheck(items);
          this.setState({
            'mode': 'tree',
            'tree': items
          });
        });

        this.props.actionManager.on('open-load-project-menu',  this.openLoadProjectMenu);
    }

    openLoadProjectMenu(){
      this.setState({
        'mode': 'load-project',
        'altmode': 'load-project',
        'altmenu': 'Load Project'
      });
    }

    getNodeIcon(node){
      if (node.type == "workplan"){
        return <span className='icon-letter'>W</span>;
      }else if (node.type == "selective"){
        return <span className='icon-letter'>S</span>;
      }else{
        return null;
      }
    }

    modeSelected(info){
      var newMode = info.key;
      this.setState({mode: newMode});
    }

    onClickNode(self, node){

    }

    renderNode(node){
      var cName = 'node';
      //cName += (node.state && node.state.selected) ? ' is-active' : '';
      return <span
          id={node.id}
          className={cName}
          onClick={this.onClickNode.bind(this, node)}
          onMouseDown={function(e){e.stopPropagation()}}
      >
          {node.icon}
          {node.name}
      </span>;
    }

    render() {
      const modeMenu = ( <Menu mode='horizontal' selectedKeys={[this.state.mode]} onClick={this.modeSelected} className='sidebar-menu'>
          <MenuItem key='tree'>Object Tree</MenuItem>
          <MenuItem key={this.state.altmode}>{this.state.altmenu}</MenuItem>
      </Menu> );
        return <div className="sidebar">
                  {modeMenu}
                  {this.state.mode == 'tree' ?
                  <Tree
                      paddingLeft={32}              // left padding for children nodes in pixels
                      tree={this.state.tree}        // tree object
                      renderNode={this.renderNode}  // renderNode(node) return react element
                  />
                  : null}
                  {this.state.mode == 'load-project' ?
                  <LoadProjectView socket={this.props.socket} actionManager={this.actionManager}/>
                  : null}
                  {this.state.mode == 'configure' ?
                  <div className='configure-view'></div>
                  : null}
               </div>;
    }
}
