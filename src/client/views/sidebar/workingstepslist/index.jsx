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
    
    shouldComponentUpdate(nextProps, nextState) {
        return this.props.ws !== nextProps.ws;
    }

    render() {
        console.log("Rendering workingstep view");
        this.decorators.ws = this.props.ws;
        return (
            <Treebeard data={this.props.workingstepList} style={ts.style} decorators={this.decorators} />
        );
    }
}
