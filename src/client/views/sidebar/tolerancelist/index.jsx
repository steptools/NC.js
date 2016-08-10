import React from 'react';
import {Treebeard} from 'react-treebeard';
import ts from '../tree_style.jsx';

var tolerancesByWS = [];

export default class ToleranceList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {curr: false};

    this.getTolerancesByWS = this.getTolerancesByWS.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.addCurrent = this.addCurrent.bind(this);
    this.addUpcoming = this.addUpcoming.bind(this);
    this.addPrevious = this.addPrevious.bind(this);
    this.addWorkpieces = this.addWorkpieces.bind(this);

    this.decorators = ts.decorators;
    this.decorators.propertyCb = this.props.propertyCb;
    this.decorators.toggleHighlight = this.props.toggleHighlight;
    this.decorators.highlightedTolerances = this.props.highlightedTolerances;
  }

  componentDidMount() {
    $('.sidebar ul.sidebar-menu-tabs + ul').addClass('treebeard flat');
  }

  componentWillReceiveProps(nextProps) {
    this.decorators.highlightedTolerances = nextProps.highlightedTolerances;
  }

  componentWillUnmount() {
    // some properties need to be removed before unmounting
    for (let i in this.props.workingstepCache) {
      this.props.workingstepCache[i].leaf = true;
      delete this.props.workingstepCache[i].children;
      delete this.props.workingstepCache[i].icon;
    }
  }

  // use props to get just the tolerances (no workpieces)
  getTolerancesByWS() {
    if (tolerancesByWS.length > 0) {
      return;
    }
    
    let tolerances = [];
    for (let tol in this.props.toleranceCache) {
      if (this.props.toleranceCache[tol].type === 'tolerance') {
        tolerances.push(this.props.toleranceCache[tol]);
      }
    }
    
    let wsList = this.props.workingstepList;
    let tolsInWs;
    for (let i in wsList) {
      let ws = wsList[i];
      tolsInWs = [];
      for (let tol in tolerances) {
        if (tolerances[tol].workingsteps.indexOf(ws) >= 0) {
          let tolToAdd = tolerances[tol];
          tolsInWS.push(tolToAdd);
        }
      }
      tolerancesByWS.push(tolsInWS);
    }

    console.log(tolerancesByWS);
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

  addCurrent(tolList) {
    if (!this.props.curWS.toBe || this.props.curWS.toBe <= 0) {
      return;
    }
    let wp = this.props.toleranceCache[this.props.curWS.toBe.id];
    if (wp && wp.children && wp.children.length > 0) {
      tolList.push({
        name: 'Active Tolerances',
        leaf: true,
        type: 'divider',
        id: -1,
      });
      Array.prototype.push.apply(tolList, wp.children);
    } else {
      tolList.push({
        name: 'No Active Tolerances',
        leaf: true,
        type: 'divider',
        id: -1,
      });
    }
  }

  addUpcoming(tolList) {
    let upcomingWorkingsteps = this.getUpcomingWorkingsteps();
    let upcomingTols = this.upcomingTols(upcomingWorkingsteps);

    let upcoming = false;

    for (let i = 0; i < upcomingTols.length; i++) {
      if (upcomingTols[i].length !== 0) {
        upcoming = true;
        break;
      }
    }

    if (!upcoming) {
      tolList.push({
        name: 'No Upcoming Tolerances',
        leaf: true,
        type: 'divider',
        id: -2,
      });
      return;
    }

    tolList.push({
      name: 'Upcoming Tolerances',
      leaf: true,
      type: 'divider',
      id: -2,
    });

    for (let i = 0; i < upcomingTols.length; i++) {
      if (upcomingTols[i].length === 0) {
        continue;
      }
      let ws = this.props.workingstepCache[upcomingWorkingsteps[i]];
      ws.children = upcomingTols[i];
      ws.leaf = false;
      ws.icon = <div className='icon custom letter'>{i + 1}</div>;
      tolList.push(ws);
    }
  }

  addPrevious(tolList) {

  }

  addWorkpieces(tolList, dividerId) {
    tolList.push({
      name: 'Workpieces With Tolerances',
      leaf: true,
      type: 'divider',
      id: dividerId,
    });

    Array.prototype.push.apply(tolList, this.props.toleranceList.map((id) => {
      return this.props.toleranceCache[id];
    }));
  }

  render() {
    // TODO: pass tolerances by WS (in order) through props for optimization
    this.getTolerancesByWS();
    let tolList = [];
    //this.addCurrent(tolList);
    //this.addUpcoming(tolList);
    //this.addPrevious(tolList);
    //this.addWorkpieces(tolList, -(n + 1));

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
