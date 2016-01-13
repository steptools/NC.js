import React from 'react';

export default class LoadProjectView extends React.Component {
  constructor(){
    super();
  }

  componentWillMount(){
    console.log("Requesting projects");
    this.props.socket.on("projects", (projects) => {
      console.log(projects);
    });
    this.props.socket.emit("req:projects");
  }

  render(){
    return (
      <div>woo</div>
    );
  }
}
