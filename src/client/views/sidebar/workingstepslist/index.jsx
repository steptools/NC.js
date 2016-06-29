import React from 'react';
import _ from 'lodash';
import request from 'superagent';

export default class WorkingstepList extends React.Component {
  constructor(props){
    //Create the constructor for the component
    super(props);

    this.renderNode = this.renderNode.bind(this);
  }
  
  renderNode(node){
      let cName = 'node';
        if(node.id == this.props.ws) cName= 'node running-node';
      return <ol
          id={node.id}
          className={cName}
          onClick={(event) => {this.props.propertyCb(node);}}
          onMouseDown={function(e){e.stopPropagation()}}
          style={{"paddingLeft" : "5px"}}
          key={node.id} >
          {node.icon}
          <span className="textbox">{node.name}</span>
      </ol>;
  }

  componentDidMount(){
      
  }

  render(){
    return (
      <div className='m-tree'>
        {_.values(this.props.workingstepCache).map((workingstep, i) => {
          return <div className='m-node' key={i}>
            {this.renderNode(workingstep)}
          </div>;
        })}
      </div>
    );
  }
}

WorkingstepList.propTypes = {cbMode: React.PropTypes.func.isRequired, cbTree: React.PropTypes.func.isRequired, 
                                pid: React.PropTypes.string.isRequired, ws: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]).isRequired};