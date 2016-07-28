import React from 'react';
import Menu,{Item as MenuItem} from 'rc-menu';
import GeometryView from '../../geometry';
import request from 'superagent';

function getIcon(type, data) {
  if (!data) {
    data = '';
  }

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
    case 'diameter':
      return 'icon custom diameter';
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
    case 'length':
    case 'distance':
      return 'icon glyphicons glyphicons-ruler';
    case 'feedrate':
      return 'icon glyphicons glyphicons-dashboard';
    /*case 'cornerRadius':
      return 'icon custom corner';*/
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
    this.renderWorkingsteps = this.renderWorkingsteps.bind(this);
  }

  selectWS(event, entity) {
    if (event.key === 'goto') {
      let url = '/v3/nc/state/ws/' + entity.id;
      request.get(url).end();
    } else if (event.key === 'tool') {
      // open properties page for associated tool
      this.props.propertiesCb(this.props.tools[entity.tool]);
    } else if (event.key === 'preview' && this.props.preview === false) {
      this.props.previewCb(true);

      let prevId;
      if (entity.type === 'workingstep') {
        prevId = entity.toBe.id;
      } else if (entity.type === 'tolerance') {
        prevId = entity.workpiece;
      } else if (entity.type === 'tool') {
        prevId = entity.id + '/tool';
      } else {
        prevId = entity.id;
      }

      let url = this.props.manager.app.services.apiEndpoint
        + this.props.manager.app.services.version + '/nc';
      this.props.manager.dispatchEvent({
        type: 'setModel',
        viewType: 'preview',
        path: prevId,
        baseURL: url,
        modelType: 'previewShell',
      });
    }
    // some other menu item clicked, no need to do anything
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.entity !== nextProps.entity ||
        nextProps.entity === null) {
      this.props.previewCb(false);
    }
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
          Running
        </MenuItem>
      );
    } else if (entity.enabled !== true) {
      this.properties.push(
        <MenuItem disabled key='active' className='property active'>
          <div className={getIcon('disabled')}/>
          Disabled
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

  renderPreviewButton(entity) {
    if (entity.type === 'workplan' || entity.type === 'selective' ||
        entity.type === 'workplan-setup') {
      return;
    }

    this.properties.push(
      <MenuItem
        key='preview'
        className='property button'
      >
        Preview
      </MenuItem>
    );
  }

  renderGoto(entity) {
    if (entity.type !== 'workingstep') {
      return;
    }
    this.properties.push(
      <MenuItem
        key='goto'
        disabled={!(entity.enabled === true && this.props.ws !== entity.id)}
        className='property button'
      >
        Go to Workingstep
      </MenuItem>
    );
  }

  renderTolerance(entity) {
    if (entity.type !== 'tolerance') {
      return;
    }
    let prettyType = entity.tolTypeName.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    this.properties.push(
      <MenuItem disabled key='tolType' className='property tolType'>
        <div className={getIcon('tolerance type')}/>
        Type: {prettyType}
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

  renderWorkingsteps(entity) {
    if (entity.type !== 'workpiece' && entity.type !== 'tool' &&
        entity.type !== 'tolerance') {
      return null;
    }
    let title, steps;
    if (entity.workingsteps.length > 0) {
      title = 'Used in Workingsteps:';
      steps = (<div className='list'>
        {entity.workingsteps.map((step) =>
          this.renderNode(this.props.workingsteps[step])
        )}
      </div>);
    } else {
      title = 'Not used in any workingsteps.';
    }

    title = (<div className='title'>{title}</div>);

    this.properties.push (
      <MenuItem disabled key='workingsteps' className='property children'>
        {title}
        {steps}
      </MenuItem>
    );
  }

  renderWorkpieces(entity) {
    if (entity.type !== 'workingstep') {
      return null;
    }

    let asIs, toBe, delta;

    if (entity.asIs &&
        entity.asIs.id !== 0 &&
        this.props.toleranceCache[entity.asIs.id]) {
      asIs = this.renderNode(this.props.toleranceCache[entity.asIs.id]);
      if (asIs) {
        asIs = (
          <div>
            As-Is{entity.asIs.inherited ? ' (Inherited)' : null}: {asIs}
          </div>
        );
      }
    }
    if (entity.toBe &&
        entity.toBe.id !== 0 &&
        this.props.toleranceCache[entity.asIs.id]) {
      toBe = this.renderNode(this.props.toleranceCache[entity.toBe.id]);
      if (toBe) {
        toBe = (
          <div>
            To-Be{entity.toBe.inherited ? ' (Inherited)' : null}: {toBe}
          </div>
        );
      }
    }
    if (entity.delta &&
        entity.delta.id !== 0 &&
        this.props.toleranceCache[entity.delta.id]) {
      delta = this.renderNode(this.props.toleranceCache[entity.delta.id]);
      if (delta) {
        delta = (
          <div>
            Delta{entity.delta.inherited ? ' (Inherited)' : null}: {delta}
          </div>
        );
      }
    }

    let title = (<div className='title'>Workpieces:</div>);

    this.properties.push(
      <MenuItem disabled key='workpieces' className='property children'>
        {title}
        <div className='list'>
          {asIs}
          {toBe}
          {delta}
        </div>
      </MenuItem>
    );
  }

  renderChildren(entity) {
    if (entity.type === 'workingstep' || entity.type === 'tool' ||
        entity.type === 'tolerance') {
      return null;
    }
    let children = entity.children; // this.normalizeChildren(entity);
    let childrenTitle;
    if (entity.type === 'workpiece') {
      if (children && children.length > 0) {
        childrenTitle = 'Tolerances:';
      } else {
        childrenTitle = 'No tolerances defined.';
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

  renderPreview(entity) {
    if (entity === null) {
      return null;
    }

    let cName = 'preview-container';
    let content;

    if (this.props.preview === true) {
      cName = cName + ' visible';

      content = (
        <GeometryView
          manager={this.props.manager}
          selectedEntity={entity}
          guiMode={this.props.guiMode}
          resize={this.props.resize}
          isCadView={false}
          toleranceCache={this.props.toleranceCache}
          locked={false}
          parentSelector='.preview-container'
          viewType='preview'
        />
      );
    }

    return (
      <div className='preview'>
        <div className='preview-cover' />
        <div className={cName} id='preview-container'>
          <span
            className={'preview-exit ' + getIcon('exit')}
            onClick={() => {
              this.props.previewCb(false);
            }}
          />
          {content}
        </div>
      </div>
    );
  }

  //TODO: corner radius icon
  //      diameter icon
  //      length icon
  renderTools(entity){
    if(entity.type !== 'tool'){
      return null;
    }
    if(entity.cornerRadius.toFixed(0) !== '0'){
      this.properties.push (
        <MenuItem disabled key='tRadius' className='property children'>
          <div className={getIcon('cornerRadius')}/>
          Corner Radius: {entity.cornerRadius.toFixed(2)} {entity.cornerRadiusUnit}
        </MenuItem>
      );
    }

    if(entity.diameter){
      this.properties.push (
        <MenuItem disabled key='tDiameter' className='property children'>
          <div className={getIcon('diameter')}/>
          Diameter: {entity.diameter} {entity.diameterUnit}
        </MenuItem>
      );
    }

    if(entity.length){
      this.properties.push (
        <MenuItem disabled key='tLength' className='property children'>
          <div className={getIcon('length')}/>
          Tool Length: {entity.length} {entity.lengthUnit}
        </MenuItem>
      );
    }
  }

  renderProperties(entity) {
    this.properties = [];
    if (entity === null) {
      return null;
    }

    this.renderPreviewButton(entity);
    this.renderActive(entity);
    this.renderTime(entity);
    this.renderDistance(entity);
    this.renderWorkingstep(entity);
    this.renderWorkpieces(entity);
    this.renderGoto(entity);
    this.renderTools(entity);
    this.renderTolerance(entity);
    this.renderWorkingsteps(entity);
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
      previousEntity: this.props.previousEntities[0],
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
        {this.renderPreview(entityData.entity)}
        <div className='titlebar'>
          <div className='titleinfo'>
            <span
              className={'title-back ' + getIcon('back')}
              onClick={() => {
                this.props.propertiesCb(entityData.previousEntity, true);
              }}
            />
            <span className={entityData.titleIcon} />
            <span className='title'>
              <div className='type'>{entityData.type}</div>
              <div className='name'>{entityData.name}</div>
            </span>
            <span
              className={'title-exit ' + getIcon('exit')}
              onClick={() => {
                this.props.propertiesCb(null);
                this.props.previewCb(false);
              }}
            />
          </div>
        </div>
        {this.renderProperties(entityData.entity)}
      </div>
    );
  }
}
