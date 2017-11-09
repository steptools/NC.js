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

var md = require('node-markdown').Markdown;
import Menu, {SubMenu, Item as MenuItem} from 'rc-menu';
let changetext='';

function getIcon(type, data) {
  if (!data) {
    data = '';
  }

  switch (type) {
    case 'backward':
      return 'icon fa fa-step-backward';
    case 'forward':
      return 'icon fa fa-step-forward';
    case 'play':
      return 'icon fa fa-play';
    case 'pause':
      return 'icon fa fa-pause';
    case 'speed':
      if (data === 'left') {
        return 'icon left fa fa-bicycle';
      } else if (data === 'right') {
        return 'icon right fa fa-rocket';
      }
    case 'feedrate':
      return 'icon fa fa-tachometer';
    case 'spindlespeed':
      if (data === 'CW') {
        return 'icon fa fa-rotate-right';
      } else if (data === 'CCW') {
        return 'icon fa fa-rotate-left';
      } else {
	  //return 'icon fa fa-refresh';
        return 'icon fa fa-stop-circle-o';
      }
    case 'changelog':
      return 'icon fa fa-book';
    case 'live':
      return 'icon fa fa-dot-circle-o';
    case 'geometry':
      return 'icon fa fa-cube';
    case 'download':
      return 'icon fa fa-cloud-download';
    case 'reset':
      return 'icon fa fa-recycle';
    case 'view':
      return 'icon fa fa-eye';
    case 'noview':
      return 'icon fa fa-eye-slash';
    case 'setup':
      return 'icon fa fa-arrows';
    case 'exit':
      return 'icon fa fa-times-circle';
    case 'plus':
      return 'icon fa fa-plus';
    case 'minus':
      return 'icon fa fa-minus';
    case 'left':
      return 'icon fa fa-arrow-left';
    case 'right':
      return 'icon fa fa-arrow-right';
    default:
      return 'icon fa fa-question-circle';
  }
}

class Button extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let icon = getIcon(this.props.eventKey);
    if (this.props.icon) {
      icon = getIcon(this.props.icon);
    }
    return (
      <MenuItem {...this.props} className='button'>
        <div className={icon}/>
        {this.props.children}
      </MenuItem>
    );
  }
}
class GeomBtn extends React.Component {
  constructor(props) {
    super(props);
    this.dlClick = this.dlClick.bind(this);
    this.visClick = this.visClick.bind(this);
  }

  dlClick(info){
    this.props.actionManager.emit('STLDL',this.props.type);
  }
  visClick(info){
    let eventArgs = {'usage':this.props.type};
    if(this.props.view ==='noview') eventArgs.show = true;
    this.props.actionManager.emit('changeVis',eventArgs);
  }
  render() {
    let icon = getIcon(this.props.view);
    let iid='';
    if(this.props.iid) iid=this.props.iid;
    return (
      <MenuItem {...this.props} className = "button">
        <div className="geom">
          <div className={icon} id={iid} onClick = {this.visClick} />
          <div className={getIcon("download")} onClick = {this.dlClick} />
        </div>
        {this.props.children}
      </MenuItem>
    );
  }  
}
class Slider extends React.Component {  constructor(props) {
    super(props);
    this.changed = this.changed.bind(this);
  }

  changed(info) {
    this.props.changed(info);
  }

  render() {
    let name = this.props.id.charAt(0).toUpperCase() + this.props.id.slice(1);
    let cName = 'slider no-icons';
    let left = null;
    let right = null;
    if (this.props.icons) {
      cName = 'slider with-icons';
      left = (
        <div
          className={getIcon(this.props.id, 'left')}
          onMouseUp={this.changed}
          onKeyUp={this.changed}
          value='0'
        />
      );
      right = (
        <div
          className={getIcon(this.props.id, 'right')}
          onMouseUp={this.changed}
          onKeyUp={this.changed}
          value='200'
        />
      );
    }
    // TODO:Remove onMouseUp / onKeyUp if/when bug is fixed with onChange
    return (
      <MenuItem {...this.props} key={this.props.id} className={cName}>
        <input
          className={'range-' + this.props.id}
          onChange={this.changed}
          onMouseUp={this.changed}
          onKeyUp={this.changed}
          value={this.props.val}
          type='range'
          min='0'
          max='200'
          step='1'
        />
        <div className='sliderData'>
          {left}
          <div className={'slider-text text-' + this.props.id}>{name}</div>
          {right}
        </div>
      </MenuItem>
    );
  }
}

Slider.propTypes = {
  changed: React.PropTypes.func.isRequired,
  id: React.PropTypes.string.isRequired,
  val: React.PropTypes.number.isRequired,
  icons: React.PropTypes.string.isRequired,
};

class FeedSpeed extends React.Component {
  constructor(props){
    super(props);
  }
  render(){return (        <MenuItem {...this.props} key='feed-speed' className='info feed-speed'>
          <div className='item'>
            <div className={getIcon('feedrate')}/>
            <div className='text'>
              <div className='title'>Feed rate:</div>
              <div className='value'>{this.props.feed}</div>
            </div>
          </div>
          <div className='item'>
            <div className={this.props.rotation}/>
            <div className='text'>
              <div className='title'>Spindle speed:</div>
              <div className='value'>{this.props.speed}</div>
            </div>
          </div>
        </MenuItem>)}
}
FeedSpeed.propTypes = {
  feed: React.PropTypes.number.isRequired,
  speed: React.PropTypes.number.isRequired,
  rotation: React.PropTypes.string.isRequired
}
class ProbeMessage extends React.Component {
  constructor(props){
    super(props);
  }
  render(){
    if (this.props.msg.length<3) {
      return null; //Empty object
    }
    return (
      <MenuItem {...this.props} key='probe-message' className='info probe'>
      <div className='item'>
        <div className='text'>
        Probe Results-
          X:{this.props.msg[0].toFixed(3)+' '}
          Y:{this.props.msg[1].toFixed(3)+' '}
          Z:{this.props.msg[2].toFixed(3)+' '}
      </div>
      </div>
      </MenuItem>);
  }
}
ProbeMessage.propTypes = {
  msg: React.PropTypes.arrayOf(React.PropTypes.number).isRequired
}
class GeomMenu extends React.Component {
  constructor(props){
    super(props);
    this.pathClick = this.pathClick.bind(this);
    this.state = _.mapValues(props.rootVis, function(val) {
      return val ? 'view' : 'noview';
    });
    this.props.actionManager.on('changeVis',(arg)=>{
      let l={}; 
      if(this.state[arg.usage]==='view')
        l[arg.usage]='noview'; 
      else
        l[arg.usage]='view';
      this.setState(l);
    });
  }

  pathClick(info){
    if(info.key==='toolpath'){
      let eventArgs = {usage:'toolpath'};
      if(this.state.toolpath == 'noview') eventArgs.show = true;
      this.props.actionManager.emit('changeVis',eventArgs);
    }
  }
  render(){ return(
      <SubMenu {...this.props} onClick={this.pathClick} className="geommenu" title={
        <div className='item'>
          <div className={getIcon('geometry')} />
          <div className='text'>
            <div className='title'>Geometry</div>
          </div>
        </div>
      } >
        <GeomBtn actionManager = {this.props.actionManager} view={this.state.asis} type='asis'>As-Is</GeomBtn>
        <GeomBtn actionManager = {this.props.actionManager} view={this.state.tobe} type='tobe'>To-Be</GeomBtn>
        <GeomBtn actionManager = {this.props.actionManager} view={this.state.cutter} type='cutter'>Tool</GeomBtn>
        <GeomBtn actionManager = {this.props.actionManager} view={this.state.fixture} type='fixture'>Fixture</GeomBtn>
        <GeomBtn actionManager = {this.props.actionManager} view={this.state.machine} type='machine'>Machine</GeomBtn>
        <GeomBtn actionManager = {this.props.actionManager} view={this.state.inprocess} type='inprocess'>Removal</GeomBtn>
        <Button icon={this.state.toolpath} key='toolpath'>Toolpath</Button>
      </SubMenu>
  )}
}

class NumericIncr extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      delta: 1
    };

    this.increment = this.increment.bind(this);
    this.decrement = this.decrement.bind(this);
    this.incPrecision = this.incPrecision.bind(this);
    this.decPrecision = this.decPrecision.bind(this);
  }

  increment() {
    this.props.valueChange(this.props.value + this.state.delta);
    let event = {delta: this.state.delta, active: this.props.active};
    this.props.actionManager.emit('moveFixture', event);
  }

  decrement() {
    this.props.valueChange(this.props.value - this.state.delta);
    let event = {delta: 0 - this.state.delta, active: this.props.active};
    this.props.actionManager.emit('moveFixture', event);
  }

  incPrecision() {
    this.setState({delta: this.state.delta * 10});
  }

  decPrecision() {
    this.setState({delta: this.state.delta * 0.1});
  }

  render() {
    let valueText = (typeof this.props.value == 'number') ? this.props.value.toFixed(10) : '   N/A   ';
    return(
      <div className='numeric-control'>
        <div className='value-bar'>
          <div className='value-text'>Value</div>
          <div className={'minus-icon ' + getIcon('minus')} onClick={this.decrement}/>
          <div className='value'>{valueText}</div>
          <div className={'plus-icon ' + getIcon('plus')} onClick={this.increment}/>
        </div>
        <div className='precision-bar'>
          <div className='precision-text'>Delta</div>
          <div className={'left-icon ' + getIcon('left')} onClick={this.decPrecision}/>
          <div className='precision'>{this.state.delta.toExponential(0)}</div>
          <div className={'right-icon ' + getIcon('right')} onClick={this.incPrecision}/>
        </div>
      </div>
    );
  }
}

class FixturePlacement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      x: null,
      y: null,
      z: null,
      id: null,
      active: null
    };

    this.wsChange = this.wsChange.bind(this);
    this.onAxisSelect = this.onAxisSelect.bind(this);
    this.valueChange = this.valueChange.bind(this);
    this.applyChange = this.applyChange.bind(this);
  }

  componentDidUpdate() {
    this.wsChange();
  }

  wsChange() {
    if (this.props.curr_ws.fixtureID != this.state.id) {
      this.setState({
        x: this.props.curr_ws.fixturePlacement[0],
        y: this.props.curr_ws.fixturePlacement[1],
        z: this.props.curr_ws.fixturePlacement[2],
        id: this.props.curr_ws.fixtureID
      });
    }
  }

  onAxisSelect(axis) {
    this.setState({active: axis});
  }

  valueChange(newValue) {
    let newState = {};
    newState[this.state.active] = newValue;
    this.setState(newState);
  }

  applyChange() {
    let placement = this.props.curr_ws.fixturePlacement;
    placement[0] = this.state.x;
    placement[1] = this.state.y;
    placement[2] = this.state.z;
    request.put('/v3/nc/workplan/' + this.state.id + '/workpiece')
    .send({'id': this.state.id, 'placement': placement}).then(()=> {
      request.get('/v3/nc/state/delta').then((res)=> {
        this.props.cadManager.onDelta(res.body);
        request.get('/v3/nc/state/ws/' + this.props.curr_ws.id).end();
      })
    })
    this.props.actionManager.emit('removeTransparent');
  }

  render() {
    let cNames = {
      x: 'axis-select',
      y: 'axis-select',
      z: 'axis-select'
    };
    if (this.state.active) {
      cNames[this.state.active] = 'axis-select active';
    }

    return(
      <MenuItem {...this.props}>
        <div className='fixture-placement-container'>
          <div className='titlebar'>
            <div className={'title-icon ' + getIcon('setup')} onClick={this.applyChange}/>
            <div className='title'>Fixture Placement</div>
          </div>
          <NumericIncr 
            actionManager={this.props.actionManager} 
            value={this.state[this.state.active]}
            valueChange={this.valueChange}
            active={this.state.active}
          />
          <div className='axes-bar'>
            <div className={cNames.x} onClick={()=> {this.onAxisSelect('x')}}>X</div>
            <div className={cNames.y} onClick={()=> {this.onAxisSelect('y')}}>Y</div>
            <div className={cNames.z} onClick={()=> {this.onAxisSelect('z')}}>Z</div>
          </div>
        </div>
      </MenuItem>
    );
  }
}

class SetupMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      setupMode: false,
      facesArray: []
    };

    this.enterSetupMode = this.enterSetupMode.bind(this);
    this.exitSetupMode = this.exitSetupMode.bind(this);
    this.resetFaces = this.resetFaces.bind(this);
    this.applyChange = this.applyChange.bind(this);

    this.props.actionManager.on('faceSelected', (face)=> {
      let newFacesArray = this.state.facesArray;
      if (newFacesArray.length < 3) {
        request.get('/v3/nc/workpieces/' + face.id + '/type').then((res)=> {
          let addFace = {id: face.id, type: res.text};
          newFacesArray.push(addFace);
          this.setState({facesArray: newFacesArray});
        });
      }
    });
  }

  enterSetupMode() {
    this.setState({setupMode: true});
    this.props.actionManager.emit('changeSetup', true);
  }

  exitSetupMode() {
    this.setState({setupMode: false});
    this.resetFaces();
    this.props.actionManager.emit('changeSetup', false);
  }

  resetFaces() {
    this.setState({facesArray: []});
  }

  applyChange() {
    let ex_id = this.props.curr_ws.setupID;
    let fix_id = this.props.curr_ws.fixtureID;
    let face_ids = _.map(this.state.facesArray, (obj)=> {return obj.id;});
    request.put('/v3/nc/workplan/' + ex_id + '/setup')
    .send({'id': ex_id, 'face_ids': face_ids, 'fix_id': fix_id}).then(()=> {
      request.get('/v3/nc/state/delta').then((res)=> {
        this.props.cadManager.onDelta(res.body);
        request.get('/v3/nc/state/ws/' + this.props.curr_ws.id).end();
        this.exitSetupMode();
      })
    })
  }

  render() {
    let disp = this.state.facesArray;
    let faceZ = disp[0] ? '#' + disp[0].id + ' (' + disp[0].type + ')' : "Select a face";
    let faceY = disp[1] ? '#' + disp[1].id + ' (' + disp[1].type + ')' : "Select a face";
    let faceX = disp[2] ? '#' + disp[2].id + ' (' + disp[2].type + ')' : "Select a face";
    if (!this.state.setupMode) {
      return(
        <Button {...this.props} icon='setup' key='setup-changer-button' onClick={this.enterSetupMode}>
          Change Setup
        </Button>
      );
    }
    else {
      return(
        <MenuItem {...this.props} key='setup-changer-menu-item' className='setup'>
          <div className='titlebar'>
            <div className={'title-icon ' + getIcon('setup')} onClick={this.applyChange}/>
            <div className='title'>Select Three Intersecting Faces</div>
            <div className={'title-exit ' + getIcon('exit')} onClick={this.exitSetupMode}/>
          </div>
          <div className='facearea'>
            <div className={'face-info'}>
              <span className={'face-title'}>Face Z:</span>
              <span className={'face-id'}>{faceZ}</span> 
            </div>
            <div className={'face-info'}>
              <span className={'face-title'}>Face Y:</span>
              <span className={'face-id'}>{faceY}</span>
            </div>
            <div className={'face-info'}>
              <span className={'face-title'}>Face X:</span>
              <span className={'face-id-x'}>{faceX}</span>
              <div className={'face-info-icon ' + getIcon('reset')} onClick={this.resetFaces}/>
            </div>
          </div>
        </MenuItem>
      );
    }
  }
}

let resetProcessVolume = function(){
  request.get('/v3/nc/geometry/delta/reset').end();
}
export default class HeaderView extends React.Component {
  constructor(props) {
    super(props);

    this.simulateMenuItemClicked = this.simulateMenuItemClicked.bind(this);
    this.updateSpeed = this.updateSpeed.bind(this);
    this.getFeedSpeedInfo = this.getFeedSpeedInfo.bind(this);
    this.updateSpindleSpeed = this.updateSpindleSpeed.bind(this);
    this.updateFeedrate = this.updateFeedrate.bind(this);
    this.props.cadManager.addEventListener('rootmodel:add',()=>{this.forceUpdate();});
  }

  componentDidMount() {
    let changes = $('#changes');
    let logbutton = $('#logbutton');

    // get the current tool
    let url = '/changelog/';
    request
      .get(url)
      .end((err,res) => {
        if (!err && res.ok) {
          changetext=res.text;
          changes.html(md(changetext));
          logbutton.html('v' + md(changetext).split('\n')[0].split(' ')[1]);
        }
      });
  }

  getFeedSpeedInfo() {
    let fr = 'Not defined';
    let ss = 'Not defined';
    let ssIcon = null;
    if (this.props.feedRate !== undefined) {
      fr = this.props.feedRate.toFixed(1) + ' ' + 'mm/min';
    }
    if (this.props.spindleSpeed !== 0) {
      ss = Math.abs(this.props.spindleSpeed) + ' rev/min';
      if (this.props.spindleSpeed > 0) {
        ss += ' (CCW)';
        ssIcon = getIcon('spindlespeed', 'CCW');
      } else {
        ss += ' (CW)';
        ssIcon = getIcon('spindlespeed', 'CW');
      }
    } else {
      ssIcon = getIcon('spindlespeed');
    }
    return [fr, ss, ssIcon];
  }

  updateSpeed(info) {
    this.props.actionManager.emit('simulate-setspeed', info);
  }

  updateSpindleSpeed(info) {
    this.props.spindleUpdateCb(info.speed);
  }

  updateFeedrate(info) {
    this.props.feedUpdateCb(info.feed);
  }

  simulateMenuItemClicked(info) {
    switch (info.key) {
      case 'forward':
        this.props.actionManager.emit('sim-f');
        break;
      case 'play':
        this.props.actionManager.emit('sim-pp');
        if (this.props.ppbutton === 'play') {
          this.props.cbPPButton('pause');
        } else {
          this.props.cbPPButton('play');
        }
        break;
      case 'backward':
        this.props.actionManager.emit('sim-b');
        break;
      case 'changelog':
        let changelog = document.getElementById('changes');
        if (this.props.logstate === false) {
          changelog.className = 'changelog visible';
          this.props.cbLogstate(true);
        } else {
          changelog.className = 'changelog';
          this.props.cbLogstate(false);
        }
        break;
      case 'reset':
        resetProcessVolume();
        break;
      default:
        if (info.key.indexOf('machine') >= 0) {
          let id = info.key.split('-')[1];
          this.props.changeMachine(Number(id));
    }
  }
  }

  render() {
    let ppbtntxt = '';
    let ppbutton = this.props.ppbutton;
    if (this.props.ppbutton === 'play') {
      ppbtntxt = 'Play';
    } else {
      ppbtntxt = 'Pause';
    }

    let feedSpeedInfo = this.getFeedSpeedInfo();
    let probeMsg=[];
    if (this.props.probeMsg){
       probeMsg = this.props.probeMsg;
     }
    let curr_ws = this.props.workingstepCache[this.props.ws];
    const headerMenu = (
      <Menu
        mode='horizontal'
        onClick={this.simulateMenuItemClicked}
        className='header-menu'
      >
        <Button key='backward'>Prev</Button>
        <Button key='play' icon={ppbutton}>{ppbtntxt}</Button>
        <Button key='forward'>Next</Button>
        <Slider
          id='speed'
          changed={this.updateSpeed}
          val={this.props.speed}
          icons='true'
        />
  { this.props.cadManager.getRootModel("state/key") ?      
	<GeomMenu actionManager = {this.props.actionManager} rootVis = {this.props.cadManager.getRootVis()}/>
  : null }
        <FeedSpeed disabled feed={feedSpeedInfo[0]} speed={feedSpeedInfo[1]} rotation={feedSpeedInfo[2]} />
        <ProbeMessage msg={probeMsg}/>
        <SetupMenu
          cadManager={this.props.cadManager}
          actionManager={this.props.actionManager}
          curr_ws={curr_ws}
        />
        <FixturePlacement
          cadManager={this.props.cadManager}
          actionManager={this.props.actionManager}
          curr_ws={curr_ws}
        />
        <MenuItem className="info"> File: {this.props.fname}</MenuItem>
      </Menu>
    );

    return (
      <div className='header'>
        {headerMenu}
        <div className='changelog' id='changes'/>
      </div>
    );
  }
}

HeaderView.propTypes = {
  cadManager: React.PropTypes.object.isRequired,
  cbPPButton: React.PropTypes.func.isRequired,
  ppbutton: React.PropTypes.string.isRequired,
  fname: React.PropTypes.string.isRequired
};
