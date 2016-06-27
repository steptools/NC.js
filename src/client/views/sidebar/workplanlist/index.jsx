import React from 'react';
import request from 'superagent';
import Tree from 'react-ui-tree';

require('../../../stylesheets/components/_workplanlist');

export default class WorkplanList extends React.Component {
  constructor(props){
    //Create the constructor for the component
    super(props);
    this.state = {workplan: {}};

    this.renderNode = this.renderNode.bind(this);
  }

  getNodeIcon(node,num){
      if (node.type == "workplan"){
        return <span className='icon-letter'>W</span>;
      }else if (node.type == "selective"){
        return <span className='icon-letter'>S</span>;
      }else{
        return <span className='icon-letter'>WS</span>;;
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
      let url = "/v2/nc/projects/"+this.props.pid+"/workplan/";
      let resCb = function(err,res){ //Callback function for response
            if(!err && res.ok){
  	          var nodes = {};
              let wsCount = 1;
              nodes = JSON.parse(res.text);
  	          var nodeCheck = (node)=>{
    	          node.icon = this.getNodeIcon(node, wsCount);
                if(node.type === 'selective' || node.type === 'workplan'){
                  if(node.children.length != 0)
                    node.children.map(nodeCheck);
                  node.leaf = false;
                }
                else{
                  node.leaf = true;
                  wsCount = wsCount + 1;
                }
              }
              nodeCheck(nodes);
              this.setState({workplan: nodes});
            }
      }
      resCb = resCb.bind(this); //Needs to bind this in order to have correct this
      request
        .get(url)
        .end(resCb);
  }

  render(){
    return (
        <Tree
          paddingLeft={32}              // left padding for children nodes in pixels
          tree={this.state.workplan}        // tree object
          renderNode={this.renderNode}  // renderNode(node) return react element
        />
    );
  }
}