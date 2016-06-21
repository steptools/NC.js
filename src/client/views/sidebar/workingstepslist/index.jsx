import React from 'react';

export default class WorkingstepList extends React.Component {
  constructor(props){
    //Create the constructor for the component
    super(props);
    this.state = {workingsteps: []};

    this.renderNode = this.renderNode.bind(this);
  }

  getNodeIcon(node,num){
      if (node.type == "workplan"){
        return <span className='icon-letter'>W</span>;
      }else if (node.type == "selective"){
        return <span className='icon-letter'>S</span>;
      }else{
        return <span className='icon-letter'>{num}</span>;;
      }
  }

  onObjectTreeNodeClick(node, self){
        let xhr = new XMLHttpRequest();
        let url = "/v2/nc/projects/"+this.props.pid+"/state/ws/" + node["id"];
        xhr.open("GET",url,true);
        xhr.send(null);
    }

  renderNode(node){
      let cName = 'node';
        if(node.id == this.props.ws) cName= 'node running-node';
      return <ol
          id={node.id}
          className={cName}
          onClick={this.onObjectTreeNodeClick.bind(this, node)}
          onMouseDown={function(e){e.stopPropagation()}}
          style={{"paddingLeft" : "5px"}}
          key={node.id} >
          {node.icon}
          <span className="node-text">{node.name}</span>
      </ol>;
  }

  componentDidMount(){
    //populate the state to have all workingsteps as individual json objects in a list
    let xhr = new XMLHttpRequest();
      xhr.onreadystatechange = ()=>{
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            // Node preprocessing
            let nodes = [];
            let nodeCheck = (node)=>{
              node.icon = this.getNodeIcon(node,nodes.length+1);
              if(node.children) node.children.forEach(nodeCheck);
              node.children = [];
                if(node.type === "workingstep")
                  nodes.push(node);
            }
            let json = JSON.parse(xhr.responseText);
            nodeCheck(json);
            this.props.cbMode('tree');
            this.props.cbTree(nodes);
            this.setState({workingsteps: nodes});
          }
        }
      };
      console.log(this.props.pid);
      let url = "/v2/nc/projects/"+this.props.pid+"/workplan/";
      xhr.open("GET",url,true);
      xhr.send(null);
  }

  render(){
    return (
      <div className='m-tree'>
        {this.state.workingsteps.map((workingstep, i) => {
          return <div className='m-node' key={i}>
            {this.renderNode(workingstep)}
          </div>;
        })}
      </div>
    );
  }
}