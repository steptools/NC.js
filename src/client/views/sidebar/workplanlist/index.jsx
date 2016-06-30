import React from 'react';
import _ from 'lodash';
import request from 'superagent';
import {Treebeard} from 'react-treebeard';

export default class WorkplanList extends React.Component {
  constructor(props){
    super(props);
    this.state = {};
    this.onToggle = this.onToggle.bind(this);
    this.data = this.getNodes();
  }
  
  /*
  renderNode(node){
      var cName = 'node';
      //node is a generic white node
      //node running-node is a node that is the current workingstep
      //node disabled is a node that is part of a selective but isn't
      //currently enabled
      if(node.id == this.props.ws) {
        cName= 'node running-node';
      }
      else{
        if(node.enabled === false)
          cName = 'node disabled';
      }
      
      node.icon = this.getNodeIcon(node);
      
      return <span
          id={node.id}
          className={cName}
          onClick={this.onClickNode.bind(null, node)}
          onMouseDown={node.undraggable ? function(e){e.stopPropagation()} : undefined}
      >
          {node.icon}
          <span className="textbox">{node.name}</span>
      </span>;
  }

  getNodeIcon(node){
    if (node.type == "workplan"){
      return <span className="icon-workplan glyphicons glyphicons-cube-empty"></span>;
    }else if (node.type == "selective"){
      return <span className="icon-workplan glyphicons glyphicons-list-numbered"></span>;
    }else{
      return <span className="icon-workplan glyphicons glyphicons-blacksmith"></span>;
    }
  }
  */
  
  onToggle(node, toggled){
    if(this.state.cursor){this.state.cursor.active = false;}
    node.active = true;
    if(node.children){ node.toggled = toggled; }
    this.setState({ cursor: node });
  }
  
  toggleNodes(node){
    for (let i = 0; i < _.size(node.children); i++) {
      if (node.children[i].children) {
        node.children[i].toggled = true;
        this.toggleNodes(node.children[i]);
      }
    }
  }
  
  getNodes(){
    let nodes = this.props.workplanCache;
    nodes.toggled = true;
    this.toggleNodes(nodes);
    console.log(nodes);
    return nodes;
  }
  
  render(){
    return (
      <Treebeard
        data={this.data}
        onToggle={this.onToggle}
      />
    );
  }
}
