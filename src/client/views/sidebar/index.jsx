import React from 'react';
import Tree from 'react-ui-tree';
import Menu from 'rc-menu';
var MenuItem = Menu.Item;

export default class SidebarView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          'mode': 'tree',
          'tree': {
            "name": "Hello",
            "children" : [
              {
                "name": "world",
                isLeaf:true
              },
              {
                "name": "World!",
                isLeaf:true
              }
            ]
          }
        };

        var self = this;
        this.props.socket.on('modeltree', (items)=>{
          this.setState({
            'mode': 'tree',
            'tree': items
          });
        });

        this.modeSelected = this.modeSelected.bind(this);
        this.renderNode = this.renderNode.bind(this);
    }

    modeSelected(info){
      var mode = info.item.props.select;
      // this.setState({mode: mode})
    }

    onClickNode(self, node){

    }

    renderNode(node){
      var cName = 'node';
      //cName += (node.state && node.state.selected) ? ' is-active' : '';
      return <span
          id={node.id}
          className={cName}
          onClick={this.onClickNode.bind(this, node)}
          onMouseDown={function(e){e.stopPropagation()}}
      >
          {node.name}
      </span>;
    }

    render() {
      const modeMenu = ( <Menu mode='horizontal' onClick={this.modeSelected} className='sidebar-menu'>
          <MenuItem select='tree'>Object Tree</MenuItem>
          <MenuItem select='configure' disabled>Configure</MenuItem>
      </Menu> );
        return <div className="sidebar">
                  {modeMenu}
                  {this.state.mode == 'tree' ?
                  <Tree
                      paddingLeft={20}              // left padding for children nodes in pixels
                      tree={this.state.tree}        // tree object
                      renderNode={this.renderNode}  // renderNode(node) return react element
                  />
                  : null}
                  {this.state.mode == 'configure' ?
                  <div className='configure-view'></div>
                  : null}
               </div>;
    }
}
