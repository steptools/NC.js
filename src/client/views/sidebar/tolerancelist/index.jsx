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
        if(node.id == this.state.tol) cName= 'node running-node';
      return <ol
          id={node.id}
          className={cName}
          onClick={this.onObjectTreeNodeClick.bind(this, node)}
          onMouseDown={function(e){e.stopPropagation()}}
          style={{"paddingLeft" : "5px"}}
          key={node.id} >
          {node.icon}
          <span className="textbox">{node.name}</span>
      </ol>;
  }

  componentDidMount(){
      let url = "/v2/nc/projects/"+this.props.pid+"/workplan/";
      let resCb = function(err,res){ //Callback function for response
            if(!err && res.ok){
              // Node preprocessing
              let nodes = [];
              let nodeCheck = (node)=>{
                node.icon = <span className={'icon-tolerance '+node.type} />
                if(node.children) node.children.forEach(nodeCheck);
                node.children = [];
                if(node.type === "workingstep")
                    nodes.push(node);
              };
              let json = JSON.parse(res.text);
              nodeCheck(json);
              this.setState({tolerances: nodes});
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