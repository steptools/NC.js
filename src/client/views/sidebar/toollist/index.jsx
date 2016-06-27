import React from 'react';
import request from 'superagent';

export default class ToolList extends React.Component {
  constructor(props){
    //Create the constructor for the component
    super(props);
    this.state = {tools: [],"curtool":""};

    this.renderNode = this.renderNode.bind(this);
  }

  onObjectTreeNodeClick(node, self){
      // TODO: do something when we click a tool
    }

  renderNode(node){
      let cName = 'node';
      if(node.id == this.state.curtool) cName= 'node running-node';
      return <ol
          id={node.id}
          type = {node.name}
          className={cName}
          onClick={this.onObjectTreeNodeClick.bind(this, node)}
          onMouseDown={function(e){e.stopPropagation()}}
          style={{"paddingLeft" : "5px"}}
          key={node.id} >
          {node.icon}
          <span className="textbox-tool">{node.name} {node.value}</span>
      </ol>;
  }

  componentDidMount(){
      let url = "/v2/nc/projects/"+this.props.pid+"/tools/";
      let resCb = function(err,res){ //Callback function for response
            if(!err && res.ok){
                // Node preprocessing
                let json = JSON.parse(res.text);

                _.each(json, (tool)=> {
                    tool.icon = <span className='icon-tool' />
                })

                this.setState({tools: json});
            }
      }
      resCb = resCb.bind(this); //Needs to bind this in order to have correct this
      request
        .get(url)
        .end(resCb);
      let url2 = "/v2/nc/projects/"+this.props.pid+"/tools/"+this.props.ws;
      let resCb2 = function(err,res){
        if(!err && res.ok){
          this.setState({"curtool":res.text});
        }
      }
      resCb2 = resCb2.bind(this);
      request
        .get(url2)
        .end(resCb2);

  }

  componentWillReceiveProps(){
    let url2 = "/v2/nc/projects/"+this.props.pid+"/tools/"+this.props.ws;
      let resCb2 = function(err,res){
        if(!err && res.ok){
          this.setState({"curtool":res.text});
        }
      }
      resCb2 = resCb2.bind(this);
      request
        .get(url2)
        .end(resCb2);
  }

  render(){
    return (
      <div className='m-tree'>
        {this.state.tools.map((tool, i) => {
          return <div className='m-node' key={i}>
            {this.renderNode(tool)}
          </div>;
        })}
      </div>
    );
  }
}

ToolList.propTypes = {cbMode: React.PropTypes.func.isRequired, cbTree: React.PropTypes.func.isRequired,
                                pid: React.PropTypes.string.isRequired}
