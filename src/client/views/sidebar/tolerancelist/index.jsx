import React from 'react';
import request from 'superagent';

export default class ToleranceList extends React.Component {
  constructor(props){
    //Create the constructor for the component
    super(props);

    this.renderNode = this.renderNode.bind(this);
  }

  renderNode(node){
      return <ol
          id={node.id}
          value = {node.value}
          type = {node.toleranceType}
          className="node"
          onClick={(event) => {this.props.propertyCb(node)}}
          onMouseDown={function(e){e.stopPropagation()}}
          style={{"paddingLeft" : "5px"}}
          key={node.id} >
          {node.icon}
          <span className="textbox-tolerance">{node.toleranceType} {node.value}</span>
      </ol>;
  }

  componentDidMount(){
      
  }

  render(){
    return (
      <div className='m-tree'>
        {this.props.toleranceCache.map((tolerance, i) => {
          return <div className='m-node' key={i}>
            {this.renderNode(tolerance)}
          </div>;
        })}
      </div>
    );
  }
}

ToleranceList.propTypes = {cbMode: React.PropTypes.func.isRequired, cbTree: React.PropTypes.func.isRequired,
                                pid: React.PropTypes.string.isRequired}
