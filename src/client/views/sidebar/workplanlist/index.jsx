import React from 'react';
import _ from 'lodash';
import {Treebeard} from 'react-treebeard';
import ts from '../tree_style.jsx';

export default class WorkplanList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.onToggle = this.onToggle.bind(this);
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
        this.setState({cursor: node});
    }

    render() {
        console.log("Rendering workplan view");
        this.decorators.ws = this.props.ws;
        return (
            <Treebeard data={this.props.workplanCache} onToggle={this.onToggle} style={ts.style} decorators={this.decorators}/>
        );
    }
}
