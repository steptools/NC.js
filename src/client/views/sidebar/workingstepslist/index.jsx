import React from 'react';
import _ from 'lodash';
import {Treebeard} from 'react-treebeard';
import ts from '../tree_style.jsx';

export default class WorkingstepList extends React.Component {
    constructor(props) {
        super(props);
        this.decorators = ts.decorators;
        this.decorators.propertyCb = this.props.propertyCb;
    }
    
    /*
    getNodeIcon(node, num) {
        if (node.type == "workplan") {
            return <span className='icon-letter'>W</span>;
        } else if (node.type == "selective") {
            return <span className='icon-letter'>S</span>;
        } else {
            return <span className='icon-letter'>{num + 1}</span>;
        }
    }

    renderNode(nodeId, num) {

        let node = this.props.workingstepCache[nodeId];
        node.icon = this.getNodeIcon(node, num);
        let cName = 'node';
        if (node.id == this.props.ws) 
            cName = 'node running-node';
        return <ol id={node.id} className={cName} onClick={(event) => {
            this.props.propertyCb(node);
        }} onMouseDown={function(e) {
            e.stopPropagation()
        }} style={{
            "paddingLeft": "5px"
        }} key={node.id}>
            {node.icon}
            <span className="textbox">{node.name}</span>
        </ol>;
    }*/

    render() {
        console.log("Rendering workingstep view");
        this.decorators.ws = this.props.ws;
        return (
            <Treebeard data={this.props.workingstepList} style={ts.style} decorators={this.decorators} />
        );
    }
}
