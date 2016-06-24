import React from 'react';
import request from 'superagent';

export default class ToleranceList extends React.Component {
  constructor(props){
    //Create the constructor for the component
    super(props);
    this.state = {tolerances: []};

    this.renderNode = this.renderNode.bind(this);
  }

  onObjectTreeNodeClick(node, self){
      // TODO: do something when we click a tolerance
    }

  renderNode(node){
      let cName = 'node';
        if(node.id == this.state) cName= 'node running-node';
      return <ol
          id={node.id}
          value = {node.value}
          type = {node.type}
          className={cName}
          onClick={this.onObjectTreeNodeClick.bind(this, node)}
          onMouseDown={function(e){e.stopPropagation()}}
          style={{"paddingLeft" : "5px"}}
          key={node.id} >
          {node.icon}
          <span className="textbox-tolerance">{node.id} {node.type} {node.value}</span>
      </ol>;
  }

  componentDidMount(){
      let url = "/v2/nc/projects/"+this.props.pid+"/tolerances/";
      let resCb = function(err,res){ //Callback function for response
            if(!err && res.ok){
                // Node preprocessing
                let json = JSON.parse(res.text);

                _.each(json, (tolerance) => {
                    tolerance.type = tolerance.type.replace(/_TOLERANCE/g, '').toLowerCase();
                    tolerance.icon = <span className={'icon-tolerance tolerance-'+tolerance.type} />
                })

                this.setState({tolerances: json});
            }
      }
      resCb = resCb.bind(this); //Needs to bind this in order to have correct this
      request
        .get(url)
        .end(resCb);
  }

  render(){
    return (
      <div className='m-tree'>
        {this.state.tolerances.map((tolerance, i) => {
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
