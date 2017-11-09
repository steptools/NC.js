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

export default class ToolList extends React.Component {
  constructor(props) {
    super(props);

    this.renderNode = this.renderNode.bind(this);
  }

  renderNode(node) {
    let cName = 'node';
    if (node.id === this.props.curtool) {
      cName += ' running-node';
    }
    if (node.enabled === false) {
      cName += ' disabled';
    }

    return (
      <ol
        id={node.id}
        type = {node.toolType}
        className={cName}
        onClick={() => this.props.propertyCb(node)}
        onMouseDown={function(e) {
          e.stopPropagation();
          return false;
        }}
        style={{'paddingLeft': '5px'}}
        key={node.id}
      >
        {node.icon}
        <span className="textbox">{node.name} {node.value}</span>
      </ol>
    );
  }

  render() {
    let treeHeight;
    if (this.props.isMobile) {
      treeHeight = {'height': '100%'};
    }

    let tListActive = (_.values(this.props.tools).map((tool, i) => {
      if (tool.enabled === true) {
        return (<div className='m-node' key={i}>
          {this.renderNode(tool)}
        </div>);
      } else {
        return '';
      }
    }));

    let tListDisabled = (_.values(this.props.tools).map((tool, i) => {
      if (tool.enabled === false) {
        return (<div className='m-node' key={i}>
          {this.renderNode(tool)}
        </div>);
      } else {
        return '';
      }
    }));

    return (
      <div className='m-tree' style={treeHeight}>
        {tListActive}
        {tListDisabled}
      </div>
    );
  }
}

ToolList.propTypes = {
  cbMode: React.PropTypes.func.isRequired,
  cbTree: React.PropTypes.func.isRequired,
};
