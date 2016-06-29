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
      return <span
          id={node.id}
          className={cName}
          onClick={(event) => {this.props.propertyCb(node);}}
      >
          {node.icon}
          {node.name}
      </span>;
  }

  componentDidMount(){
      
  }

  render(){
    return (
        <Tree
          paddingLeft={12}              // left padding for children nodes in pixels
          tree={this.props.workplanCache}        // tree object
          renderNode={this.renderNode}  // renderNode(node) return react element
        />
    );
  }
}
