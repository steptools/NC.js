import React from 'react';
import _ from 'lodash';
import {Treebeard} from 'react-treebeard';
import ts from '../tree_style.jsx';

export default class WorkplanList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.onToggle = this.onToggle.bind(this);
        this.data = this.getTreeData();
        this.decorators = ts.decorators;
        this.decorators.propertyCb = this.props.propertyCb;
    }
    
    onToggle(node, toggled) {
        if (this.state.cursor) {
            this.state.cursor.active = false;
        }
        node.active = true;
        if (node.children) {
            node.toggled = toggled;
        }
        this.setState({cursor: node});
    }

    toggleNodes(node) {
        for (let i = 0; i < _.size(node.children); i++) {
            if (node.children[i].children) {
                node.children[i].toggled = true;
                this.toggleNodes(node.children[i]);
            }
        }
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

  shouldComponentUpdate(nextProps, nextState) {
  return this.props.ws !== nextProps.ws;
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

    render() {
        this.decorators.ws = this.props.ws;
        return (<Treebeard data={this.data} onToggle={this.onToggle} style={ts.style} decorators={this.decorators} />);
    }
}
