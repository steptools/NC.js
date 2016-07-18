// NOTE: styleguide compliant
import React from 'react';
var md = require('node-markdown').Markdown;
import Menu, {Item as MenuItem} from 'rc-menu';

function getIcon(type) {
  switch (type) {
    case 'backward':
      return 'icon glyphicon glyphicon-step-backward';
    case 'forward':
      return 'icon glyphicon glyphicon-step-forward';
    case 'play':
      return 'icon glyphicon glyphicon-play';
    case 'pause':
      return 'icon glyphicon glyphicon-pause';
    case 'speed-left':
      return 'icon left glyphicons glyphicons-turtle';
    case 'speed-right':
      return 'icon right glyphicons glyphicons-rabbit';
    case 'changelog':
      return 'icon glyphicon glyphicon-book';
    default:
      return 'icon glyphicons glyphicons-question-sign';
  }
}

class ButtonItem extends React.Component {
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

class SliderMenuItem extends React.Component {
  render() {
    return (
      <MenuItem {...this.props}>
        <div className='header-menu-item menu-item-slider'>
          {this.props.children}
        </div>
      </MenuItem>
    );
  }
}

class Slider extends React.Component {
  constructor(props) {
    super(props);
    this.changed = this.changed.bind(this);
  }

  changed(info) {
    this.props.changed(info);
  }

  render() {
    let name = this.props.id.charAt(0).toUpperCase() + this.props.id.slice(1);
    if (this.props.left && this.props.right && this.props.prefix) {
      let prefix = this.props.prefix;
      let left = prefix + '-' + this.props.left;
      let right = prefix + '-' + this.props.right;
      let cNameLeft = 'slider-icon slider-left-icon ' + prefix + ' ' + left;
      let cNameRight = 'slider-icon slider-right-icon ' + prefix + ' ' + right;
      // TODO:Remove onMouseUp / onKeyUp if/when bug is fixed with onChange
      return (
        <div className='slider sliderWithIcons'>
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
            <div
              className={cNameLeft}
              onMouseUp={this.changed}
              onKeyUp={this.changed}
              value='0'
            />
            <div className={'slider-text text-' + this.props.id}>{name}</div>
            <div
              className={cNameRight}
              onMouseUp={this.changed}
              onKeyUp={this.changed}
              value='200'
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className='slider sliderNoIcons'>
          <input
            className={'range-' + this.props.id}
            onChange={this.changed}
            type='range'
            min='0'
            max='200'
            step='1'
            value={this.props.val}
          />
          <div className='sliderData'>
            <output className={'text-' + this.props.id}>{name}</output>
          </div>
        </div>
      );
    }
  }
}

Slider.propTypes = {
  changed: React.PropTypes.func.isRequired,
  id: React.PropTypes.string.isRequired,
  val: React.PropTypes.number.isRequired,
  left: React.PropTypes.string.isRequired,
  right: React.PropTypes.string.isRequired,
};

export default class HeaderView extends React.Component {
  constructor(props) {
    super(props);

    this.simulateMenuItemClicked = this.simulateMenuItemClicked.bind(this);
    this.updateSpeed = this.updateSpeed.bind(this);
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

  updateSpeed(info) {
    this.props.actionManager.emit('simulate-setspeed', info);
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

    let curStep = this.props.workingstepCache[this.props.ws];
    let feedRate = 'Not defined';
    let spindleSpeed = 'Not defined';
    if (curStep) {
      if (curStep.feedRate !== 0) {
        feedRate = curStep.feedRate + ' ' + curStep.feedUnits;
      }
      if (curStep.speed !== 0) {
        spindleSpeed = Math.abs(curStep.speed) + ' ' + curStep.speedUnits;
        if (curStep.speed > 0) {
          spindleSpeed = spindleSpeed + ' (CCW)';
        } else {
          spindleSpeed = spindleSpeed + ' (CW)';
        }
      }
    }

    const headerMenu = (
      <Menu
        mode='horizontal'
        onClick={this.simulateMenuItemClicked}
        className='header-menu'
      >
        <ButtonItem key='backward'>Prev</ButtonItem>
        <ButtonItem key='play' icon={ppbutton}>{ppbtntxt}</ButtonItem>
        <ButtonItem key='forward'>Next</ButtonItem>
        <SliderMenuItem key='speed'>
          <Slider
            id='speed'
            changed={this.updateSpeed}
            val={this.props.speed}
            prefix='glyphicons'
            left='turtle'
            right='rabbit'
          />
        </SliderMenuItem>
        <MenuItem disabled key='feed-speed'>
          <div className='feed-speed'>Feed rate:</div>
          <div className='feed-speed value'>{feedRate}</div>
          <div className='feed-speed'>Spindle speed:</div>
          <div className='feed-speed value'>{spindleSpeed}</div>
        </MenuItem>
        <ButtonItem key='changelog' id='logbutton'>
          <div className='version' id='logbutton'>v1.1.0</div>
        </ButtonItem>
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
