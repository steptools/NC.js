// NOTE: styleguide compliant
import React from 'react';
var md = require('node-markdown').Markdown;
import Menu, {Item as MenuItem} from 'rc-menu';

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
  }

  componentDidMount() {
    let changes = document.getElementById('changes');
    let logbutton = document.getElementById('logbutton');
    let chlog = new XMLHttpRequest();
    chlog.open('GET', '/log');
    chlog.onreadystatechange = function() {
      if (chlog.readyState === 4 && chlog.status === 200) {
        let res = chlog.responseText.toString();
        changes.innerHTML = md(res);
        logbutton.innerHTML = 'v' + md(res).split('\n')[0].split(' ')[1];
      }
    };
    chlog.send();
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
    }
  }

  render() {
    //console.log('render header');
    let mtc = this.props.mtc;
    //console.log(mtc);

    const headerMenu = (
      <Menu
        mode='horizontal'
        onClick={this.simulateMenuItemClicked}
        className='header-menu'
      >
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
              <div className='value'>Not defined</div>
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
