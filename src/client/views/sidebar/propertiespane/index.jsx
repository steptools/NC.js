// TODO: styleguide compliant
import React from 'react';
import Menu,{Item as MenuItem} from 'rc-menu';
import request from 'superagent';
import _ from 'lodash';

function getIcon(type, data) {
  switch (type) {
    case 'workplan':
      return 'icon glyphicons glyphicons-cube-empty';
    case 'workplan-setup':
      return 'icon glyphicons glyphicons-cube-black';
    case 'selective':
      return 'icon glyphicons glyphicons-list-numbered';
    case 'workingstep':
      return 'icon glyphicons glyphicons-blacksmith';
    case 'tool':
      return 'icon custom tool';
    case 'workpiece':
      return 'icon custom workpiece';
    case 'tolerance':
      if (data) {
        return 'icon custom tolerance ' + data;
      }
      return 'icon glyphicons glyphicons-question-sign';
    case 'tolerance type':
      return 'icon glyphicons glyphicons-adjust';
    case 'tolerance value':
      return 'icon glyphicons glyphicons-adjust-alt';
    case 'back':
      return 'icon glyphicons glyphicons-circle-arrow-left';
    case 'exit':
      return 'icon glyphicons glyphicons-remove-sign';
    case 'active':
      return 'icon glyphicons glyphicons-ok-circle';
    case 'inactive':
      return 'icon glyphicons glyphicons-remove-circle';
    case 'disabled':
      return 'icon glyphicons glyphicons-ban-circle';
    case 'time':
      return 'icon glyphicons glyphicons-clock';
    case 'distance':
      return 'icon glyphicons glyphicons-ruler';
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
    default:
      return 'icon glyphicons glyphicons-question-sign';
  }
}

function getFormattedTime(entity) {
  let time;

  if (entity.timeUnits !== 'second') {
    time = entity.baseTime + ' ' + entity.timeUnits;
    return time;
  }

  let stepTime = new Date(entity.baseTime * 1000);
  let h = stepTime.getUTCHours();
  let mm = stepTime.getUTCMinutes();
  let ss = stepTime.getUTCSeconds();

  if (h === 1) {
    time = h + ' hr ' + mm + ' min ' + ss + ' sec';
  } else if (h > 0) {
    time = h + ' hrs ' + mm + ' min ' + ss + ' sec';
  } else if (mm > 0) {
    time = mm + ' min ' + ss + ' sec';
  } else {
    time = ss + ' sec';
  }

  return time;
}

export default class PropertiesPane extends React.Component {
  constructor(props) {
    super(props);

    this.state = {entity: null};

    this.properties = [];

    this.selectWS = this.selectWS.bind(this);
    this.renderNode = this.renderNode.bind(this);
  }

  selectWS(event, entity) {
    if (event.key === 'goto') {
      let url = '/v3/nc/state/ws/' + entity.id;
      request.get(url).end();
    } else if (event.key === 'tool') {
      // open properties page for associated tool
      this.props.propertiesCb(this.props.tools[entity.tool]);
    }
    // some other menu item clicked, no need to do anything
  }

  renderActive(entity) {
    if (entity.type !== 'workingstep' && entity.type !== 'tolerance') {
      return;
    }
    let active = false;
    if (entity.type === 'tolerance') {
      active = (entity.tolerances && entity.tolerances[this.props.ws]);
    } else if (entity.type === 'workingstep') {
      active = (this.props.ws === entity.id);
    }

    if (active === true) {
      this.properties.push(
        <MenuItem disabled key='active' className='property active'>
          <div className={getIcon('active')}/>
          Status: Active
        </MenuItem>
      );
    } else if (entity.enabled === true) {
      this.properties.push(
        <MenuItem disabled key='active' className='property active'>
          <div className={getIcon('inactive')}/>
          Status: Inactive
        </MenuItem>
      );
    } else {
      this.properties.push(
        <MenuItem disabled key='active' className='property active'>
          <div className={getIcon('disabled')}/>
          Status: Disabled
        </MenuItem>
      );
    }
  }

  renderTime(entity) {
    if (!entity.baseTime) {
      return;
    }
    this.properties.push(
      <MenuItem disabled key='time' className='property time'>
        <div className={getIcon('time')}/>
        Base time: {getFormattedTime(entity)}
      </MenuItem>
    );
  }

  renderDistance(entity) {
    if (!entity.distance) {
      return;
    }
    this.properties.push(
      <MenuItem disabled key='distance' className='property distance'>
        <div className={getIcon('distance')}/>
        Distance: {entity.distance.toFixed(2) + ' ' + entity.distanceUnits}
      </MenuItem>
    );
  }

  renderWorkingstep(entity) {
    if (entity.type !== 'workingstep') {
      return;
    }

    let feedrateData = '';
    if (entity.feedRate !== 0) {
      feedrateData = entity.feedRate + ' ' + entity.feedUnits;
    } else {
      feedrateData = 'Not defined';
    }
    this.properties.push(
      <MenuItem disabled key='feedrate' className='property feedrate'>
        <div className={getIcon('feedrate')}/>
        Feed rate: {feedrateData}
      </MenuItem>
    );

    let spindleData = entity.speed + ' ' + entity.speedUnits;
    spindleData = spindleData.slice(1);
    let spindleIcon = null;
    if (entity.speed > 0) {
      spindleData += ' (CCW)';
      spindleIcon = getIcon('spindlespeed', 'CCW');
    } else if (entity.speed < 0) {
      spindleData += ' (CW)';
      spindleIcon = getIcon('spindlespeed', 'CW');
    } else {
      spindleData = 'Not defined';
      spindleIcon = getIcon('spindlespeed');
    }
    this.properties.push(
      <MenuItem disabled key='spindlespeed' className='property spindlespeed'>
        <div className={spindleIcon}/>
        Spindle speed: {spindleData}
      </MenuItem>
    );

    if (this.props.tools[entity.tool]) {
      this.properties.push(
        <MenuItem key='tool' className='property tool'>
            <div className={getIcon('tool')}/>
            Tool: {this.props.tools[entity.tool].name}
        </MenuItem>
      );
    }
  }

  renderGoto(entity) {
    if (entity.type !== 'workingstep') {
      return;
    }
    this.properties.push(
      <MenuItem
        key='goto'
        disabled={!(entity.enabled === true && this.props.ws !== entity.id)}
        className='property goto'
      >
        Go to Workingstep
      </MenuItem>
    );
  }

  renderTolerance(entity) {
    if (entity.type !== 'tolerance') {
      return;
    }
    this.properties.push(
      <MenuItem disabled key='tolType' className='property tolType'>
        <div className={getIcon('tolerance type')}/>
        Type: {entity.tolType} Tolerance
      </MenuItem>
    );
    this.properties.push(
      <MenuItem disabled key='tolValue' className='property tolValue'>
        <div className={getIcon('tolerance value')}/>
        Value: {entity.value}{entity.unit}
      </MenuItem>
    );
  }

  renderNode(node) {
    let cName = 'node';
    if (node.id === this.props.ws) {
      cName = 'node running-node';
    } else {
      if (node.enabled === false) {
        cName = 'node disabled';
      }
    }

    let icon = <span className={getIcon(node.type)}/>;
    if (node.type === 'tolerance') {
      icon = <span className={getIcon(node.type, node.toleranceType)}/>;
    }

    return (
      <div key={node.id}>
        <span
          id={node.id}
          className={cName}
          onClick={() => {
            this.props.propertiesCb(node);
          }}
        >
          {icon}
          <span className='textbox'>
            {node.name}
          </span>
        </span>
      </div>
    );
  }

  normalizeChildren(entity) {
    if (entity.children && entity.children.length > 0) {
      if (typeof entity.children[0] === 'object') {
        return entity.children;
      } else if (typeof entity.children[0] === 'number') {
        let children = [];
        _.each(entity.children, (c) => {
          children.push(this.props.workingsteps[c]);
        });
        return children;
      }
    }
    if (entity.workingsteps && entity.workingsteps.length > 0) {
      if (typeof entity.workingsteps[0] === 'object') {
        return entity.workingsteps;
      } else if (typeof entity.workingsteps[0] === 'number') {
        let children = [];
        _.each(entity.workingsteps, (c) => {
          children.push(this.props.workingsteps[c]);
        });
        return children;
      }
    }
    return null;
  }

  renderChildren(entity) {
    if (entity.type === 'workingstep') {
      return null;
    }
    let children = this.normalizeChildren(entity);
    let childrenTitle;
    if (entity.type === 'tolerance' || entity.type === 'tool') {
      if (children) {
        childrenTitle = 'Used in Workingsteps:';
      } else {
        childrenTitle = 'Not used in any workingsteps.';
      }
    } else if (children) {
      childrenTitle = 'Children:';
    } else {
      childrenTitle = 'No Children';
    }

    childrenTitle = (<div className='title'>{childrenTitle}</div>);
    if (children) {
      children = (
        <div className='list'>
          {children.map(this.renderNode)}
        </div>
      );
    }

    this.properties.push(
      <MenuItem disabled key='children' className='property children'>
        {childrenTitle}
        {children}
      </MenuItem>
    );
  }

  renderProperties(entity) {
    if (entity === null) {
      return null;
    }

    this.renderActive(entity);
    this.renderTime(entity);
    this.renderDistance(entity);
    this.renderWorkingstep(entity);
    this.renderGoto(entity);
    this.renderTolerance(entity);
    this.renderChildren(entity);

    return (
      <Menu
        className='properties'
        onClick={(event) => {
          this.selectWS(event, entity);
        }}
      >
        {this.properties}
      </Menu>
    );
  }

  getEntityData() {
    let entity = this.props.entity;
    let entityData = {
      entity: this.props.entity,
      previousEntity: this.props.previousEntity,
      paneName: 'properties-pane',
    };

    if (entity !== null) {
      entityData.name = entity.name;
      entityData.type = entity.type[0].toUpperCase() + entity.type.slice(1);
      entityData.paneName += ' visible';
      let icon;
      if (entity.type === 'tolerance') {
        icon = getIcon(entity.type, entity.toleranceType);
      } else {
        icon = getIcon(entity.type);
      }
      entityData.titleIcon = 'title-icon ' + icon;
    }

    return entityData;
  }

  render() {
    let entityData = this.getEntityData();

    return (
      <div className={entityData.paneName}>
        <div className='titlebar'>
          <span
            className={'title-back ' + getIcon('back')}
            onClick={() => {
              this.props.propertiesCb(entityData.previousEntity);
            }}
            onMouseOut={() => {
              $('.title-back.icon').removeClass('visible');
            }}
          />
          <div className='titleinfo'>
            <span
              className={entityData.titleIcon}
              onMouseOver={() => {
                $('.title-back.icon').addClass('visible');
              }}
            />
            <span className='title'>
              <div className='type'>{entityData.type}</div>
              <div className='name'>{entityData.name}</div>
            </span>
            <span
              className={'title-exit ' + getIcon('exit')}
              onClick={() => {
                this.props.propertiesCb(null);
              }}
            />
          </div>
        </div>
        {this.renderProperties(entityData.entity)}
      </div>
    );
  }
}
