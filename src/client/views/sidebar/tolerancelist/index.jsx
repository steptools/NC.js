import React from 'react';
import request from 'superagent';
import _ from 'lodash';
import {Treebeard} from 'react-treebeard';
import ts from '../tree_style.jsx';

export default class ToleranceList extends React.Component {
  constructor(props){
    //Create the constructor for the component
    super(props);
    this.onToggle = this.onToggle.bind(this);
    this.state = {curr: false};
    this.decorators = ts.decorators;
    this.decorators.propertyCb = this.props.propertyCb;
  }
  
  componentDidMount() {
    $('.sidebar ul.sidebar-menu-tabs + ul').addClass('treebeard');
  }

  onToggle(node, toggled) {
    if (this.state.cursor) {
        this.state.cursor.active = false;
    }
    node.active = true;
    if (node.children) {
        node.toggled = toggled;
    }
    this.setState({cursor: node, curr: !this.state.curr});
  }

  render(){
    let tolList = this.props.toleranceList.map((id) => {
        return this.props.toleranceCache[id];
    });
    
    return (
      tolList.length > 0 ?
      <Treebeard data={tolList} onToggle={this.onToggle} style={ts.style} decorators={this.decorators}/>
        : null
    );
  }
}

ToleranceList.propTypes = {cbMode: React.PropTypes.func.isRequired, cbTree: React.PropTypes.func.isRequired}
