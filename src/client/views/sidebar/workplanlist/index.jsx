import React from 'react';
import _ from 'lodash';
import {Treebeard} from 'react-treebeard';
import ts from '../tree_style.jsx';

export default class WorkplanList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.onToggle = this.onToggle.bind(this);
        this.data = this.getTreeData();
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

    toggleNodes(node) {
        for (let i = 0; i < _.size(node.children); i++) {
            if (node.children[i].children) {
                node.children[i].toggled = true;
                this.toggleNodes(node.children[i]);
            }
        }
    }

    getTreeData() {
        let treeData = {
            nodes: this.props.workplanCache,
            ws: this.props.ws,
            propertyCb: this.props.propertyCb
        }
        treeData.nodes.toggled = true;
        this.toggleNodes(treeData.nodes);
        console.log("TREE DATA:");
        console.log(treeData);
        return treeData;
    }

    render() {
        return (<Treebeard data={this.data} onToggle={this.onToggle} style={ts.style} decorators={ts.decorators} />);
    }
}
