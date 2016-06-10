import React from 'react';
import Tree from 'react-ui-tree';
require('../../model_tree/tree.scss');

export default class ToleranceTreeView extends React.Component{

  constructor(){
    super();
    this.state = {tolerances: []};
    this.renderNode = this.renderNode.bind(this);
  }

  componentDidMount(){
    this.props.socket.on("tolerancetree", (tolerances) => {
      this.setState({
        tolerances: tolerances
      });
    });
    this.props.socket.emit("req:tolerancetree");
  }

  renderNode(node){
    let cName = 'node';
    cName += (node.state && node.state.selected) ? ' is-active' : '';
    cName += (node.state && node.state.highlighted) ? ' is-highlighted' : '';
    cName += (node.state && !node.state.visible) ? ' is-hidden' : '';
    let exp = undefined;
    if (node.state && node.state.explodeDistance > 0) {
        let text = ' (' + node.state.explodeDistance + ')';
        exp = <span className="exp-distance">{text}</span>;
    }
    return <span
        id={node.id}
        className={cName}
    >
        {node.name}
    </span>;
  }

  render(){
    return (
      <div className='tolerance-tree'>
          <Tree
               paddingLeft={20}
               tree={this.state.tolerances}
               renderNode={this.renderNode}
               />
      </div>
    );
  }

}
