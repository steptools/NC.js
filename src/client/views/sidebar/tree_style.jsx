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

'use-strict';
import {Workingstep} from './workingstepslist/index.jsx'

function getNodeIcon(node) {
  if (node.type === 'workplan') {
    return <span className='icon fa fa-cube'/>;
  } else if (node.type === 'selective') {
    return <span className='icon fa fa-list-ol'/>;
  } else if (node.type === 'workplan-setup') {
    return <span className='icon fa fa-cube fa-border'/>;
  } else if (node.type === 'workingstep') {
    return <span className='icon fa fa-bolt'/>;
  } else if (node.type === 'tolerance') {
    return <span className={'icon custom tolerance ' + node.toleranceType} />;
  } else if (node.type === 'workpiece') {
    return <span className='icon custom workpiece'/>;
  } else if (node.type === 'datum') {
    return <span className={'icon custom datum ' + node.name} />;
  } else if (node.type === 'divider') {
    return null;
  } else {
    return <span className='icon fa fa-question-circle'/>;
  }
}

function hasActiveChildren(node, id) {
  if (node.id === id) {
    return 'active';
  }
  if (node.leaf) {
    return 'inactive';
  }
  for (let i = 0; i < node.children.length; i++) {
    if (hasActiveChildren(node.children[i],id) === 'active') {
      if (node.toggled === false) {
        return 'active';
      } else {
        return 'child-active';
      }

    } else if (hasActiveChildren(node.children[i],id) ==='child-active') {
      if (node.toggled === false) {
        return 'active';
      } else {
        return 'child-active';
      }
    }
  }
  return 'inactive';
}

function setDatumInfo(node, props) {

  if (props.decorators.highlightedTolerances.indexOf(node.id) >= 0) {
      node.highlightName = 'open';
      node.highlightIcon = 'highlight-button fa fa-eye';
  } else {
      node.highlightName = 'close inactive';
      node.highlightIcon = 'highlight-button fa fa-eye-slash inactive';
  }

  let clickEvent = (ev) => {
    ev.stopPropagation();
    ev.preventDefault();
    props.decorators.toggleHighlight(node.id);
  };

  let workpiece = props.decorators.toleranceCache[node.workpiece];

  if (node.openPreview && props.decorators.highlightedTolerances.indexOf(node.id) < 0) {
    clickEvent = (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      let prom = new Promise((resolve) => {
        props.decorators.propertyCb(workpiece, false, resolve);
      });

      prom.then(() => {
        props.decorators.toggleHighlight(node.id);
        props.decorators.selectEntity({key: 'preview'}, node);
      });
    }
  }

  node.highlightButton = (
    <span
      className={node.highlightIcon}
      onClick={clickEvent}
    />
  );
}

function setToleranceInfo(node, props) {
  node.name += ' - ' + node.value + node.unit + ' ' + node.rangeName;

  if (props.decorators.highlightedTolerances.indexOf(node.id) >= 0) {
      node.highlightName = 'open';
      node.highlightIcon = 'highlight-button fa fa-eye';
  } else {
      node.highlightName = 'close inactive';
      node.highlightIcon = 'highlight-button fa fa-eye-slash inactive';
  }
  let clickEvent = (ev) => {
    ev.stopPropagation();
    ev.preventDefault();
    props.decorators.toggleHighlight(node.id);
  };

  if (node.openPreview && props.decorators.highlightedTolerances.indexOf(node.id) < 0) {
    clickEvent = (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      let prom = new Promise((resolve) => {
        props.decorators.propertyCb(node, false, resolve);
      });

      prom.then(() => {
        props.decorators.toggleHighlight(node.id);
        props.decorators.selectEntity({key: 'preview'}, node);
      });
    }
  }

  node.highlightButton = (
    <span
      className={node.highlightIcon}
      onClick={clickEvent}
    />
  );
}

function setToggle(node) {
  node.toggleName = 'toggle';
  if (node.leaf === true) {
    node.toggleName = 'toggle-hidden';
  } else if (node.toggled === true) {
    node.toggleName += ' fa fa-chevron-down';
  } else {
    node.toggleName += ' fa fa-chevron-right';
  }
}

function setWorkingstepInfo(node, props) {

  node.highlightButton = (
    <span
      key='preview'
      className='icon preview fa fa-external-link-square'
      onClick={(ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        let prom = new Promise((resolve) => {
          props.decorators.propertyCb(node, false, resolve);
        });

        prom.then(() => {
          props.decorators.selectEntity({key: 'preview'}, node);
        });
      }}
    />);
}

function setNodeInfo(props) {
  let node = props.node;
  if (!node.icon) {
    node.icon = getNodeIcon(node);
  }

  node.innerName = 'inner';
  node.outerName = 'node';
  if (hasActiveChildren(node, props.decorators.ws) === 'active') {
    node.innerName += ' running-node';
  } else if (node.enabled === false) {
    node.innerName += ' disabled';
  }

  if (node.type === 'workingstep') {
    setWorkingstepInfo(node, props);
  }

  setToggle(node);

  if (node.type === 'tolerance') {
    setToleranceInfo(node, props);
  }
  if (node.type === 'datum') {
    setDatumInfo(node, props);
  }

  if (node.type === 'divider') {
    node.outerName += ' divider';
    node.innerName += ' divider';
  }

  return node;
}

const Container = (props) => {
  if(props.node.type === 'workingstep') {
    return (<div className="node">
    <div className="toggle-hidden" />
    <Workingstep 
      className="inner"
      key={props.node.id}
      workingstep={props.node}
      propertyCb={props.decorators.propertyCb}
      isCurWS={props.node.id === props.decorators.ws}
    /></div>
    );
  }
  if(props.node.type === 'Nc Function'){
    return (
      <div className="node">
        <div className="toggle-hidden"/>
        <div className="inner">
          <span className="icon fa fa-file-text-o"/>
          <span className="textbox">{props.node.name}</span>
        </div>
        </div>
    );
  }
  let node = setNodeInfo(props);
  let outerName = node.outerName;
  if(node.status === 'tolerance red'){
    outerName+=' status-red'
  } else if(node.status === 'tolerance yellow') {
    outerName+=' status-yellow'
  } else if(node.status === 'tolerance green') {
    outerName+=' status-green'
  }
  // TODO: REPLACE WORKINGSTEP ICON WITH A NUMBER

  return (
    <div
      id={node.id}
      className={outerName}
    >
      <div
        className={node.toggleName}
        onClick={props.onClick}
      />
      <div
        className={node.innerName}
        onClick={() => {
          if (!node.outerName.includes('divider') && node.type !== 'datum') {
            props.decorators.propertyCb(node);
          }
        }}
      >
        {node.icon}
        <span className='textbox'>
          {node.name}
        </span>
        {node.highlightButton}
      </div>
    </div>
  );
};

const decorators = {Container};

const style = {
  tree: {
    base: {
      listStyle: 'none',
    },
    node: {
      base: {
        listStyle: 'none',
      },
    },
  },
};

export default {
  decorators,
  style,
};
