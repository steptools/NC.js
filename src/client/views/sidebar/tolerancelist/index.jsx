import React from 'react';
import {Treebeard} from 'react-treebeard';
import ts from '../tree_style.jsx';

export default class ToleranceList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {curr: false};

    this.onToggle = this.onToggle.bind(this);
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

  render() {
    
    let tolList = [];
    
    if (this.props.curWS.toBe && this.props.curWS.toBe.id > 0) {
      let wp = this.props.toleranceCache[this.props.curWS.toBe.id];

      if (wp.children && wp.children.length > 0) {
        tolList.push({
          name: 'Active Tolerances',
          leaf: true,
          type: 'divider',
          id: -1,
        });
        tolList = tolList.concat(wp.children);
      }
    }
    
    tolList.push({
      name: 'All Workpieces',
      leaf: true,
      type: 'divider',
      id: -2,
    });
    
    tolList = tolList.concat(this.props.toleranceList.map((id) => {
      return this.props.toleranceCache[id];
    }));

    if (tolList.length <= 0) {
      return null;
    }

    return (
      <Treebeard
        data={tolList}
        onToggle={this.onToggle}
        style={ts.style}
        decorators={this.decorators}
      />
    );
  }
}

ToleranceList.propTypes = {
  cbMode: React.PropTypes.func.isRequired,
  cbTree: React.PropTypes.func.isRequired,
};
