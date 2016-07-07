import React from 'react';
import request from 'superagent';
import _ from 'lodash';

export default class ToleranceList extends React.Component {
  constructor(props){
    //Create the constructor for the component
    super(props);

    this.renderNode = this.renderNode.bind(this);
  }

  renderNode(node){
      return <ol
          id={node.id}
          type = {node.wpType}
          className="node"
          onClick={(event) => {this.props.propertyCb(node)}}
          onMouseDown={function(e){e.stopPropagation()}}
          style={{"paddingLeft" : "5px"}}
          key={node.id} >
          <span className='icon-workpiece' />
          <span className="textbox-tolerance">{node.name}</span>
      </ol>;
  }

  componentDidMount(){
      
  }

  render(){
    console.log(this.props.toleranceCache);
    return (
      <div className='m-tree'>
        {
          _.map(this.props.toleranceCache, (tolGroup, i) =>{
              return <div className='m-group' key ={i}>
                  {_.map(tolGroup, (tolerance, i) => {
                        return <div className='m-node' key={i}>
                          {this.renderNode(tolerance)}
                         </div>;
                        })
                  }
                </div>
          })
        }
      </div>
    );
  }
}

ToleranceList.propTypes = {cbMode: React.PropTypes.func.isRequired, cbTree: React.PropTypes.func.isRequired}
