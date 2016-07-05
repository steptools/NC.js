import React from 'react';
import request from 'superagent';
import Tree from 'react-ui-tree';

export default class WorkplanList extends React.Component {
  constructor(props){
    //Create the constructor for the component
    super(props);

    this.renderNode = this.renderNode.bind(this);
  }

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
          onClick={(event) => {this.props.propertyCb(node);}}
          onMouseDown={function(e){e.stopPropagation()}}
      >
          {node.icon}
          {node.name}
      </span>;
  }
  
  getNodeIcon(node){
    if (node.type == "workplan"){
      return <span className='icon-letter'>W</span>;
    }else if (node.type == "selective"){
      return <span className='icon-letter'>S</span>;
    }else{
      return <span className='icon-letter'>WS</span>;
    }
  }
  componentDidMount(){
      
  }

  render(){
    return (
        <Tree
          className='m-tree'
          paddingLeft={12}              // left padding for children nodes in pixels
          tree={this.props.workplanCache}        // tree object
          renderNode={this.renderNode}  // renderNode(node) return react element
        />
    );
  }
}
