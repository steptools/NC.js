import React from 'react';
import Tree from 'react-ui-tree';
import Menu from 'rc-menu';
import LoadProjectView from './loadproject';
import ToleranceTreeView from './tolerancetree';
import ReactTooltip from 'react-tooltip';
var MenuItem = Menu.Item;

export default class SidebarView extends React.Component {
    constructor(props) {
        super(props);
        this.state = { };

        this.openObjectTree = this.openObjectTree.bind(this);
        this.renderNode = this.renderNode.bind(this);
        this.openLoadProjectMenu = this.openLoadProjectMenu.bind(this);
        this.onProjectSelected = this.onProjectSelected.bind(this);
        this.openToleranceTree = this.openToleranceTree.bind(this);

        this.props.socket.on('modeltree', (items)=>{
          // Node preprocessing
          var nodes = {};
            nodes.name = "Workingsteps";
          nodes.children = [];
          var nodeCheck = (node)=>{
            node.icon = this.getNodeIcon(node,nodes.children.length+1);
            //if (!node.children)
            node.leaf = true;
            if(node.children) node.children.forEach(nodeCheck);
            node.children = [];
              if(!_.has(node,'type'))
                nodes.children.push(node);
          }
          nodeCheck(items);
        });

        var disabledView = (name) => {
          return (() => {
            /*this.setState({
              'mode': "disabled",
              'altmode': 'disabled',
              'altmenu': name
            })*/
            this.props.cbMode("disabled");
            this.props.cbAltMenu(name);
          }).bind(this);
        };

        var self = this;
        var updateWorkingstep = (state) => {
            self.props.cbWS(state);
            return;
        };

        this.props.actionManager.on('open-load-project-menu',  this.openLoadProjectMenu);
        this.props.actionManager.on('open-new-project-menu', disabledView('New Project'));
        this.props.actionManager.on('open-save-project-menu', disabledView('Save Project'));
        this.props.actionManager.on('open-tolerance-tree', this.openToleranceTree);
        this.props.actionManager.on('project-selected', this.onProjectSelected);
        this.props.actionManager.on('change-workingstep', updateWorkingstep);
    }

    openLoadProjectMenu(){
      /*this.setState({
        'mode': 'load-project',
        'altmode': 'load-project',
        'altmenu': 'Load Project'
      });*/
        this.props.cbMode('load-project');
      this.props.cbAltMenu('Load Project');
    }

    openObjectTree(){
      /*this.setState({
        mode: 'tree'
      });*/
        this.props.cbMode('tree');
    }

    openToleranceTree(){
      /*this.setState({
        "mode": "tolerance-tree",
        "altmode": "tolerance-tree",
        "altmenu": "Tolerance Tree"
      });*/
        this.props.cbMode('tolerance-tree');
      this.props.cbAltMenu('Tolerance Tree');
    }

    onProjectSelected(projectId){
      this.props.socket.emit('req:modeltree', projectId);
      this.openObjectTree();
      /*this.setState({
        tree: {
          name : 'Loading project...',
          isLeaf:true
        }
      })*/
      this.props.cbTree({
          name : 'Loading project...',
          isLeaf:true
      });
    }

    getNodeIcon(node,num){
      if (node.type == "workplan"){
        return <span className='icon-letter'>W</span>;
      }else if (node.type == "selective"){
        return <span className='icon-letter'>S</span>;
      }else{
        return <span className='icon-letter'>{num}</span>;;
      }
    }

    onObjectTreeNodeClick(self, node){

    }

    renderNode(node){
      var cName = 'node';
        if(node.id == this.props.ws) cName= 'node running-node';
      //cName += (node.state && node.state.selected) ? ' is-active' : '';
      return <span
          id={node.id}
          className={cName}
          onClick={this.onObjectTreeNodeClick.bind(this, node)}
          onMouseDown={function(e){e.stopPropagation()}}
      >
          {node.icon}
          {node.name}
      </span>;
    }

    render() {
        //if(this.props.guiMode == 1)
            //return null;
      // TODO currently mode menu can only have two layers
      var nested = this.props.mode != "tree";
      const modeMenu = (
        <div className='sidebar-menu-tabs'>
          <span style={{opacity:nested ?.5:0}} className='glyphicon glyphicon-menu-left back-button'></span>
          <div style={{opacity:nested?.5:1, left:nested?40:140}} onClick={this.openObjectTree} className='back'>
            <div>Object Tree</div>
          </div>
          <div style={{left:nested?200:400}} className='current'>
            {this.props.altmenu}
          </div>
        </div>
      );
        return <div className="sidebar">
                  {modeMenu}
                  {this.props.mode == 'tree' ?
                  <Tree
                      paddingLeft={32}              // left padding for children nodes in pixels
                      tree={this.props.tree}        // tree object
                      renderNode={this.renderNode}  // renderNode(node) return react element
                  />
                  : null}
                  {this.props.mode == 'load-project' ?
                  <LoadProjectView socket={this.props.socket} app={this.props.app} actionManager={this.props.actionManager}/>
                  : null}
                  {this.props.mode == 'tolerance-tree' ?
                  <ToleranceTreeView socket={this.props.socket} app={this.props.app} actionManager={this.props.actionManager}/>
                  : null}
                  {this.props.mode == "disabled" ?
                  <div className='disabled-view'> {this.props.altmenu} is currently disabled.</div>
                  : null}
               </div>;
    }
}
