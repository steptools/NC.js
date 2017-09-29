/* 
 * Copyright (c) 2016-2017 by STEP Tools Inc. 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */

import {Treebeard} from 'react-treebeard';
import Menu, {Item as MenuItem} from 'rc-menu';
import ts from '../tree_style.jsx';

let wsList = [];
var tolerancesByWS = [];

class ToleranceHighlight extends React.Component {
  constructor(props) {
    super(props);
    this.hideTolerances = this.hideTolerances.bind(this);
    this.showTolerances = this.showTolerances.bind(this);
    this.menuClick = this.menuClick.bind(this);
  }
  hideTolerances() {
    this.props.toleranceHighlightAll(false);
  };
  showTolerances() {
    this.props.toleranceHighlightAll(true);
  };
  menuClick(info) {
    (info.key === "hide") ? this.hideTolerances() : this.showTolerances();
  }
  render(){
    return (
      <div className="button-dock">
        <Menu className="buttons" onClick={this.menuClick} mode="horizontal">
          <MenuItem
            className="button"
            key="hide"
            onClick={this.hideTolerances}>
            Hide All Tolerances
          </MenuItem>
          <MenuItem
            className="button"
            key="show"
            onClick={this.showTolerances}>
            Show All Tolerances
          </MenuItem>
        </Menu>
      </div>
    );
  }
}
class ToleranceGeometry extends React.Component {
  constructor(props){
    super(props);
    this.state = {  
      loading:false,
    };
    this.visClick = this.visClick.bind(this);
    this.hideClick = this.hideClick.bind(this);
  }
  visClick() {
    this.setState({ loading: true });
    request.get('/v3/nc/geometry/delta/tolerance/reset').then(() => {
      this.props.actionManager.emit('changeVis', {'usage':'tolerance'});
      this.setState({ 
        loading: false,
        loaded:true 
      });
    });
  }
  hideClick() {
    this.props.actionManager.emit('changeVis',{'usage':'tolerance'});
    this.setState({
      loaded:false
    });
  }
  componentWillUnmount() {
    if(this.state.loaded){
      this.props.actionManager.emit('changeVis', { 'usage': 'tolerance' });
    }    
  }
  render(){
    let txt = "Load Tolerance Geometry";
    let clickFn = this.visClick;
    if(this.state.loading) {
      txt = "Loading..."
      clickFn = ()=>{};
    }
    if(this.state.loaded){
      txt = "Hide Tolerance Geometry";
      clickFn = this.hideClick;
    }
    return (
      <div className="button-dock">
        <Menu 
          className="buttons" 
          mode="horizontal"
          onClick={clickFn}
        >
          <MenuItem className="button" >
            {txt}
          </MenuItem>
        </Menu>
      </div>
    );
  }
}
class ToleranceMode extends React.Component {
  constructor(props) {
    super(props);
    this.loadQIF = this.loadQIF.bind(this);
    this.unloadQIF = this.unloadQIF.bind(this);
  }
  loadQIF(){
    request.get('/v3/nc/tolerances/qif/load').end();
  };
  unloadQIF(){
    request.get('/v3/nc/tolerances/qif/unload').end();
  };
  render(){
    return (
      <div className="tolerance-mode">
        <div  onClick={this.loadQIF}>Load QIF</div>
        <div  onClick={this.unloadQIF}>Unload QIF</div>
      </div>
    );
  }
}

export default class ToleranceList extends React.Component {
  constructor(props) {
    super(props);
    let mode = 'wp';
    if(props.isRunning) mode='ws';
    this.state = {curr: false,'mode':mode};

    this.getTolerancesByWS = this.getTolerancesByWS.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.addCurrent = this.addCurrent.bind(this);
    this.addUpcoming = this.addUpcoming.bind(this);
    this.addPrevious = this.addPrevious.bind(this);
    this.addWorkpieces = this.addWorkpieces.bind(this);
    this.addCurrentWorkpieceTolerances = this.addCurrentWorkpieceTolerances.bind(this);
    this.decorators = ts.decorators;
    this.decorators.propertyCb = this.props.propertyCb;
    this.decorators.toleranceCache = this.props.toleranceCache;
    this.decorators.openPreview = this.props.openPreview;
    this.decorators.selectEntity = this.props.selectEntity;
    this.decorators.toggleHighlight = this.props.toggleHighlight;
    this.decorators.highlightedTolerances = this.props.highlightedTolerances;
  }

  componentDidMount() {
  }

  componentWillReceiveProps(nextProps) {
    this.decorators.highlightedTolerances = nextProps.highlightedTolerances;
    let mode = 'wp';
    if(nextProps.isRunning) mode = 'ws';
    if(this.state.mode !== mode)
      this.setState({'mode':mode});
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

    wsList = this.props.workingstepList.filter(function(x) {
      return x > -1;
    });

    let tolerances = [];
    for (let tol in this.props.toleranceCache) {
      if (this.props.toleranceCache[tol].type === 'tolerance') {
        tolerances.push(this.props.toleranceCache[tol]);
      }
    }

    let tolsInWS;
    for (let i in wsList) {
      let ws = wsList[i];
      tolsInWS = [];
      for (let tol in tolerances) {
        if (tolerances[tol].workingsteps.indexOf(ws) >= 0) {
          let tolToAdd = tolerances[tol];
          tolsInWS.push(tolToAdd);
        }
      }
      tolerancesByWS.push(tolsInWS);
    }
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
    // Don't change this to use tolerancesByWS, it won't work
    tolList.push({
      name: 'Current Workingstep',
      leaf: true,
      type: 'divider',
      id: -1,
    });
    let ws = this.props.ws;
    let curWSIndex = wsList.indexOf(ws);
    ws = this.props.workingstepCache[ws];
    _.each(ws.children, (child) => {
      child.openPreview = false;
    });
    ws.leaf = true;
    ws.icon = <div className='icon custom letter'>{curWSIndex + 1}</div>;
    let displayWS = _.extend({}, ws);
    delete displayWS.children;
    tolList.push(displayWS);

    if (!this.props.curWS.toBe || this.props.curWS.toBe <= 0) {
      return;
    }
    //let wp = this.props.toleranceCache[this.props.curWS.toBe.id];
    if (_.has(ws,'tolerances')) {
      tolList.push({
        name: 'Active Tolerances / Datums',
        leaf: true,
        type: 'divider',
        id: -2,
      });
      let datums = [];
      _.each(ws.tolerances, (child) => {
        let tolsolve = (tol) => {
          tol = _.clone(tol); //We want a copy so that openPreview is unique.
          tol.openPreview = false;
          tolList.push(tol);
          if (_.has(tol, 'children')) {
            _.each(tol.children, (datum) => {
              datums.push(datum);
            });
          }
        };
        if(this.props.toleranceCache[child]!==undefined) {
          tolsolve(this.props.toleranceCache[child]);
        } else {
          request.get('/api/v3/tolerances/' + child)
            .then(tolsolve);
        }
      });
      if (datums.length > 0) {
        Array.prototype.push.apply(tolList, datums);
      }
    } else {
      tolList.push({
        name: 'No Active Tolerances / Datums',
        leaf: true,
        type: 'divider',
        id: -2,
      });
    }
  }

  addUpcoming(tolList) {
    let wsCache = this.props.workingstepCache;
    let curWSIndex = wsList.indexOf(this.props.ws);
    let upcoming = false;

    for (let i = curWSIndex + 1; i < wsList.length; i++) {
      if (wsCache[wsList[i]].tolerances && wsCache[wsList[i]].tolerances.length > 0) {
        upcoming = true;
        break;
      }
    }

    if (!upcoming) {
      tolList.push({
        name: 'No Upcoming Tolerances',
        leaf: true,
        type: 'divider',
        id: -3,
      });
      return;
    }

    tolList.push({
      name: 'Upcoming Tolerances',
      leaf: true,
      type: 'divider',
      id: -3,
    });
    let upcomingct=0; //only show max 5 upcoming
    for (let i = curWSIndex + 1; i < wsList.length; i++) {
      if(upcomingct>4) {
        break;
      }
      let ws = wsCache[wsList[i]];
      if (ws.tolerances===undefined || ws.tolerances.length === 0) {
        continue;
      }
      upcomingct++;
      let tols = _.clone(ws);
      if(tols.children===undefined) {
        tols.children=[];
      }
      _.each(tols.tolerances,(tol)=>{
        tol = _.clone(this.props.toleranceCache[tol]);
        tol.openPreview=true;
        tols.children.push(tol);
      })
      tols.leaf = false;
      tols.icon = <div className='icon custom letter'>{i + 1}</div>;
      tolList.push(tols);
    }
  }

  addPrevious(tolList) {
    let wsCache = this.props.workingstepCache;
    let curWSIndex = wsList.indexOf(this.props.ws);
    let previous = false;

    for (let i = 0; i < curWSIndex; i++) {
      if (tolerancesByWS[i] && tolerancesByWS[i].length > 0) {
        previous = true;
        break;
      }
    }

    if (!previous) {
      tolList.push({
        name: 'No Previous Tolerances',
        leaf: true,
        type: 'divider',
        id: -4,
      });
      return;
    }

    tolList.push({
      name: 'Previous Tolerances',
      leaf: true,
      type: 'divider',
      id: -4,
    });

    for (let i = 0; i < curWSIndex; i++) {
      if (tolerancesByWS[i] && tolerancesByWS[i].length === 0) {
        continue;
      }
      let ws = wsCache[wsList[i]];
      ws.children = tolerancesByWS[i];
      let tols = _.clone(ws);
      _.each(tols.children, (child,key) => {
        let tol = _.clone(child);
        tol.openPreview = true;
        tols[key]=(tol);
      });
      tols.leaf = false;
      tols.icon = <div className='icon custom letter'>{i + 1}</div>;
      tolList.push(tols);
    }
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

  addCurrentWorkpieceTolerances(tolList){
    tolList.push({
      name: 'Current Workpiece',
      leaf: true,
      type: 'divider',
      id: -1,
    });
    if(this.props.curWS === undefined){
      tolList.pop();
      tolList.push({
        name: 'Tolerances:',
        leaf:true,
        type: 'divider',
        id:-1
      });
      let tols = _.filter(this.props.toleranceCache, { 'type': 'tolerance' });
      Array.prototype.push.apply(tolList, tols);

      tolList.push({
        name: 'Datums:',
        leaf: true,
        type: 'divider',
        id: -2,
      });
      let datums = _.filter(this.props.toleranceCache, { 'type': 'datum' });
      datums.sort((a, b) => { if (a.name < b.name) return -1; else if (b.name < a.name) return 1; else return 0; });
      Array.prototype.push.apply(tolList, datums);
      return;
    } else if(this.props.curWS.toBe===undefined || this.props.curWS.toBe <=0){
      return;
    }
    let wp = this.props.toleranceCache[this.props.curWS.toBe.id];
    if (wp) {
      if (wp.children) {
        _.each(wp.children, (child) => {
          child.openPreview = false;
        });
        Array.prototype.push.apply(tolList, wp.children);
      }
      if (wp.datums) {
        Array.prototype.push.apply(tolList, wp.datums);
      }
    } else {
      tolList.push({
        name: 'No Active Tolerances / Datums',
        leaf: true,
        type: 'divider',
        id: -2,
      });
    }

  }
  render() {
    // TODO: pass tolerances by WS (in order) through props for optimization
    let tolList = [];
    if (this.state.mode === 'ws') {
      this.getTolerancesByWS();
      this.addCurrent(tolList);
    //this.addUpcoming(tolList);
    //this.addPrevious(tolList);
    } else if (this.state.mode === 'wp') {
      this.addCurrentWorkpieceTolerances(tolList);
    }

    let tree = (
      <Treebeard
        data={tolList}
        onToggle={this.onToggle}
        style={ts.style}
        decorators={this.decorators}
        toggleHighlight={this.props.toggleHighlight}
      />
    );
    if (tolList.length <= 0) {
      tree = null;
    }

    if (this.props.isMobile) {
      ts.style.tree.base.height = '100%';
    }

    return (
      <div className="tolerance-list-container">
        <div className="treebeard flat">
          {tree}
        </div>
        <ToleranceHighlight
          toleranceHighlightAll={this.props.toleranceHighlightAll}
        />
        <ToleranceGeometry actionManager={this.props.app.actionManager} />
      </div>
    );
  }
}

ToleranceList.propTypes = {
  cbMode: React.PropTypes.func.isRequired,
  cbTree: React.PropTypes.func.isRequired,
};
