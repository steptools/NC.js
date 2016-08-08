import React from 'react';
var md = require('node-markdown').Markdown;
import Menu, {SubMenu, Item as MenuItem} from 'rc-menu';
import _ from 'lodash';

function getIcon(type, data) {
  if (!data) {
    data = '';
  }

  switch (type) {
    case 'backward':
      return 'icon glyphicon glyphicon-step-backward';
    case 'forward':
      return 'icon glyphicon glyphicon-step-forward';
    case 'play':
      return 'icon glyphicon glyphicon-play';
    case 'pause':
      return 'icon glyphicon glyphicon-pause';
    case 'speed':
      if (data === 'left') {
        return 'icon left glyphicons glyphicons-turtle';
      } else if (data === 'right') {
        return 'icon right glyphicons glyphicons-rabbit';
      }
    case 'feedrate':
      return 'icon glyphicons glyphicons-dashboard';
    case 'spindlespeed':
      if (data === 'CW') {
        return 'icon glyphicons glyphicons-rotate-right';
      } else if (data === 'CCW') {
        return 'icon glyphicons glyphicons-rotate-left';
      } else {
        return 'icon glyphicons glyphicons-refresh';
      }
    case 'changelog':
      return 'icon glyphicon glyphicon-book';
    case 'live':
      return 'icon glyphicons glyphicons-record';
    case 'gcode':
      return 'icon glyphicons glyphicons-chevron-right';
    case 'machine':
      return 'icon glyphicons glyphicons-settings';
    default:
      return 'icon glyphicons glyphicons-question-sign';
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

export default class HeaderView extends React.Component {
  constructor(props) {
    super(props);

    this.simulateMenuItemClicked = this.simulateMenuItemClicked.bind(this);
    this.updateSpeed = this.updateSpeed.bind(this);
    this.getFeedSpeedInfo = this.getFeedSpeedInfo.bind(this);
    this.updateSpindleSpeed = this.updateSpindleSpeed.bind(this);
    this.updateFeedrate = this.updateFeedrate.bind(this);
    this.renderMachineButton = this.renderMachineButton.bind(this);
  }

  componentDidMount() {
    let changes = document.getElementById('changes');
    let logbutton = document.getElementById('logbutton');
    let log = this.props.cadManager.app.changelog;
    changes.innerHTML = md(log);
    logbutton.innerHTML = 'v' + md(log).split('\n')[0].split(' ')[1];
  }

  renderMachineButton(machine) {
    return (
      <MenuItem
        className='machine-button'
        key={'machine-'+machine.id}
      >
        <span>{machine.name}</span>
      </MenuItem>
    );
  }

  getFeedSpeedInfo() {
    let fr = 'Not defined';
    let ss = 'Not defined';
    let ssIcon = null;
    if (this.props.feedRate !== undefined) {
      fr = this.props.feedRate.toFixed(1) + ' ' + 'mm/min'//this.props.feedRateUnits;
    }
    if (this.props.spindleSpeed !== 0) {
      ss = Math.abs(this.props.spindleSpeed) + ' rev/min';
      if (this.props.spindleSpeed > 0) {
        ss += ' (CCW)';
        ssIcom = getIcon('spindlespeed', 'CCW');
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

  updateFeedrate(info){
    this.props.feedUpdateCb(info.feed);
  }

  simulateMenuItemClicked(info) {
    switch (info.key) {
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
      default:
        if (info.key.indexOf('machine') >= 0) {
          let id = info.key.split('-')[1];
          this.props.changeMachine(Number(id));
        }
    }
  }

  render() {
    const headerMenu = (
      <Menu
        mode='horizontal'
        onClick={this.simulateMenuItemClicked}
        className='header-menu'
        openSubMenuOnMouseEnter={false}
      >
        <MenuItem disabled key='mtc' className='info mtc'/>
        <MenuItem disabled key='live' className='info live'>
          <div className='item'>
            <div className={getIcon('live')}/>
            <div className='text'>
              <div className='value'>Stopped</div>
            </div>
          </div>
        </MenuItem>
        <MenuItem disabled key='feed-speed' className='info feed-speed'>
          <div className='item feedrate'>
            <div className={getIcon('feedrate')}/>
            <div className='text'>
              <div className='title'>Feed rate:</div>
              <div className='value'>Not defined</div>
            </div>
          </div>
          <div className='item spindlespeed'>
            <div className={getIcon('spindlespeed')}/>
            <div className='text'>
              <div className='title'>Spindle speed:</div>
              <div className='value'>1200 RPM</div>
            </div>
          </div>
        </MenuItem>
        <MenuItem disabled key='gcode' className='info gcode'>
          <div className='item'>
            <div className={getIcon('gcode')}/>
            <div className='text'>
              <div className='title'>Current GCode:</div>
              <div className='value'>Not defined</div>
            </div>
          </div>
        </MenuItem>
        <SubMenu
          title={
            <div className='item'>
              <div className={getIcon('machine')} />
              <div className='text'>
                <div className='title'>Current Machine:</div>
                <div className='value'>
                  {this.props.machineList[this.props.selectedMachine].name}
                </div>
              </div>
            </div>
          }
          key='machine'
          className='info machine button'
        >
          {_.map(_.values(this.props.machineList),this.renderMachineButton)}
        </SubMenu>
        <Button key='changelog' id='logbutton'>
          <div className='version' id='logbutton'>v1.1.0</div>
        </Button>
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
};
