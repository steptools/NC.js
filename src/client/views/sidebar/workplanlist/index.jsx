import React from 'react';
import _ from 'lodash';
import {Treebeard} from 'react-treebeard';
import ts from '../tree_style.jsx';

export default class WorkplanList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {gazorpazorp: false};
        this.onToggle = this.onToggle.bind(this);
        this.toggleToCurrentWS(this.props.workplanCache);
        this.decorators = ts.decorators;
        this.decorators.propertyCb = this.props.propertyCb;
    }

    onToggle(node, toggled) {
        if (this.state.cursor) {
            this.state.cursor.active = false;
        }
        node.active = true;
        if (node.children) {
            node.toggled = toggled;
        }
        this.setState({cursor: node, gazorpazorp: !this.state.gazorpazorp});
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.state.gazorpazorp !== nextState.gazorpazorp)
        {
          return true;
        }
        return this.props.ws !== nextProps.ws;
    }
    
    toggleToCurrentWS(node) {
        if (node.id === this.props.ws) {
            node.toggled = true;
            return true;
        } 
        if (node.enabled && !node.leaf) {
            for (let i = 0; i < node.children.length; i++) {
                if (this.toggleToCurrentWS(node.children[i])) {
                    node.toggled = true;
                    return true;
                }
            }
        }
        node.toggled = false;
    }
  }

    render() {
        //console.log("Rendering workplan view");
        this.decorators.ws = this.props.ws;
        return (
            <Treebeard data={this.props.workplanCache} onToggle={this.onToggle} style={ts.style} decorators={this.decorators}/>
        );
    }
}
