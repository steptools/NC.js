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
    this.decorators.toggleHighlight = this.props.toggleHighlight;
    this.decorators.highlightedTolerances = this.props.highlightedTolerances;
  }

  componentDidMount() {
    $('.sidebar ul.sidebar-menu-tabs + ul').addClass('treebeard');
  }

  componentWillReceiveProps(nextProps) {
    this.decorators.highlightedTolerances = nextProps.highlightedTolerances;
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

    let nextTols=[];
    let upcomingWS=false;

    for(let index in this.props.workingstepList)
    {
      if(this.props.workingstepList[index] < 0) continue;//not a ws
      if(this.props.workingstepList[index] == this.props.curWS.id)
      {
        upcomingWS=true;
        continue;
      }
      if(upcomingWS)
      {
        for(let key in this.props.toleranceCache)
        {
          for(let key2 in this.props.toleranceCache[key].workingsteps)
          {
            let goodID=true;
            for(let index2 in tolList)
            {
              if(tolList[index2].id === this.props.toleranceCache[key].id)
                goodID=false;
            }
            if((this.props.toleranceCache[key].workingsteps[key2] == this.props.workingstepList[index]) &&
              ((this.props.toleranceCache[key].children) && (this.props.toleranceCache[key].children.length > 0)) &&
              (goodID))
                nextTols[nextTols.length]=this.props.toleranceCache[key];
          }
        }
        break;
      }
    }

    //add the upcoming tolerances to the tolList
    let displayed=false;
    for(let key in nextTols)
    {
      for(let key2 in nextTols[key].children)
      {
        if(!displayed)
        {
          tolList.push({
            name: 'Upcoming Tolerances',
            leaf: true,
            type: 'divider',
            id: -2,
          });
          displayed=true;
        }
        tolList=tolList.concat(nextTols[key].children[key2]);
      }
    }

    tolList.push({
      name: 'Workpieces With Tolerances',
      leaf: true,
      type: 'divider',
      id: -3,
    });

    tolList = tolList.concat(this.props.toleranceList.map((id) => {
      return this.props.toleranceCache[id];
    }));

    if (tolList.length <= 0) {
      return null;
    }

    if (this.props.isMobile) {
      ts.style.tree.base.height = '100%';
    }

    return (
      <Treebeard
        data={tolList}
        onToggle={this.onToggle}
        style={ts.style}
        decorators={this.decorators}
        toggleHighlight={this.props.toggleHighlight}
      />
    );
  }
}

ToleranceList.propTypes = {
  cbMode: React.PropTypes.func.isRequired,
  cbTree: React.PropTypes.func.isRequired,
};
