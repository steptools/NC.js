'use-strict';

import React from 'react';

function getNodeIcon(node) {
  if (node.type === 'workplan') {
    return <span className='icon glyphicons glyphicons-cube-empty'/>;
  } else if (node.type === 'selective') {
    return <span className='icon glyphicons glyphicons-list-numbered'/>;
  } else if (node.type === 'workplan-setup') {
    return <span className='icon glyphicons glyphicons-cube-black'/>;
  } else if (node.type === 'workingstep') {
    return <span className='icon glyphicons glyphicons-blacksmith'/>;
  } else if (node.type === 'tolerance') {
    return <span className={'icon custom tolerance '+node.toleranceType} />;
  } else if (node.type === 'workpiece') {
    return <span className='icon custom workpiece'/>;
  } else if (node.type === 'divider') {
    return null;
  } else {
    return <span className='icon glyphicons glyphicons-question-sign'/>;
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

const Container = (props) => {
  let node = props.node;
  node.icon = getNodeIcon(node);

  let innerName = 'inner';
  let outerName = 'node';
  if (hasActiveChildren(node, props.decorators.ws) === 'active') {
    innerName += ' running-node';
  } else if (node.enabled === false) {
    innerName += ' disabled';
  }

  let toggleName = 'toggle';
  if (node.leaf === true) {
    toggleName = 'toggle-hidden';
  } else if (node.toggled === true) {
    toggleName += ' glyphicon glyphicon-chevron-down';
  } else {
    toggleName += ' glyphicon glyphicon-chevron-right';
  }

  let nodeName = node.name;
  let highlightButton, highlightName;
  if (node.type === 'tolerance') {
    nodeName += ' - ' + node.value + node.unit;
    if (props.decorators.highlightedTolerances.indexOf(node.id) >= 0) {
      highlightName = 'open';
    } else {
      highlightName = 'close';
    }
    highlightButton = (
      <span
        className={'highlight-button glyphicons glyphicons-eye-' + highlightName}
        onClick={(ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          props.decorators.toggleHighlight(node.id);
        }}
      />);
  }
  
  if (node.type === 'divider') {
    outerName += ' divider';
    innerName += ' divider';
  }

  return (
    <div
      id={node.id}
      className={outerName}
    >
      <div
        className={toggleName}
        onClick={props.onClick}
      />
      <div
        className={innerName}
        onClick={() => {
          if (!outerName.includes('divider')) {
            props.decorators.propertyCb(node)
          }
        }}
      >
        {node.icon}
        <span className='textbox'>
          {nodeName}
        </span>
        {highlightButton}
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
