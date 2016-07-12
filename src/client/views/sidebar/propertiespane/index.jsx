import React from 'react';
import Menu,{Item as MenuItem} from 'rc-menu';
import request from 'superagent';
import _ from 'lodash';

function getIcon(type, prefix) {
    if (!prefix) {
        prefix = '';
    }
    
    if (type === 'workplan') {
        return prefix + 'icon glyphicons glyphicons-cube-empty';
    } else if (type === 'selective') {
        return prefix + 'icon glyphicons glyphicons-list-numbered';
    } else if (type === 'workingstep') {
        return prefix + 'icon glyphicons glyphicons-blacksmith';
    } else if (type === 'tool') {
        return 'tool icon';
    } else if (type === 'exit') {
        return 'exit icon glyphicons glyphicons-remove-sign';
    } else if (type === 'time') {
        return 'time icon glyphicons glyphicons-clock';
    } else {
        return prefix + 'icon glyphicons glyphicons-question-sign';
    }
}

function getFormattedTime(entity) {
    let time = ''

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
        //Create the constructor for the component
        super(props);
        
        this.state = {entity: null};
        
        this.selectWS = this.selectWS.bind(this);
        this.renderNode = this.renderNode.bind(this);
    }

    selectWS(event, entity) {
        if (event.key === 'goto') {
            let url = '/v3/nc/state/ws/' + entity.id;
            request.get(url).end(function(err, res) {
                //
            });
        } else if (event.key === 'tool') {
            // open properties page for associated tool
            this.props.propertiesCb(this.props.tools[entity.tool]);
        } else {
            // some other menu item clicked, no need to do anything
        }
    }

    renderNode(node) {
        var cName = 'node';
        //node is a generic white node
        //node running-node is a node that is the current workingstep
        //node disabled is a node that is part of a selective but isn't
        //currently enabled
        if (node.id == this.props.ws) {
            cName = 'node running-node';
        } else {
            if (node.enabled === false) 
                cName = 'node disabled';
            }
        
        let icon = <span className={'icon ' + node.type}/>;
        return (
            <div key={node.id}>
                <span id={node.id} className={cName} onClick={(event) => {
                    this.props.propertiesCb(node);
                }}>
                    {icon}
                    <span className='textbox'>
                        {node.name}
                    </span>
                </span>
            </div>
        );
    }

    renderProperties(entity) {
        if (entity === null) {
            return null;
        }
        
        let items = null;
        
        let hasWorkingsteps = true;
        if (entity.workingsteps === undefined || entity.workingsteps.length <= 0) {
            hasWorkingsteps = false;
        }

        let timeDistance = null;
        if (entity.type === 'workingstep' || entity.type === 'selective' || entity.type === 'workplan') {
            let formattedTime = getFormattedTime(entity);

            timeDistance = <MenuItem disabled key='timeDistance' className='property timeDistance'>
                <span className='glyphicons glyphicons-clock'/>
                <div className='baseTime'>
                    Base time: {formattedTime}
                </div>
                <div className='distance'>
                    Distance: {entity.distance.toFixed(2)}
                    {entity.distanceUnits}
                </div>
            </MenuItem>;
        }

        switch (entity.type) {
            case 'workpiece':
                items = (
                    <Menu className='properties'>
                        <MenuItem disabled key='tolType' className='property'>
                            {entity.toleranceType}
                            Tolerance
                        </MenuItem>
                        <MenuItem disabled key='tolValue' className='property'>
                            Value: {entity.value}
                            {entity.unit}
                        </MenuItem>
                        {hasWorkingsteps
                            ? <MenuItem key='workingsteps' className='property children workingsteps'>
                                <div className='title'>
                                    Used in Workingsteps:
                                </div>
                                <div className='list'>
                                    {entity.workingsteps.map(this.renderNode)}
                                </div>
                            </MenuItem>
                                : <MenuItem disabled key='workingsteps' className='property children workingsteps'>
                                    <div className='title'>
                                        Not used in any workingsteps.
                                    </div>
                                </MenuItem>
                        }
                    </Menu>
                );

                break;
            case 'workingstep':
                let selectStep,
                    goToButton,
                    toolInfo;

                goToButton = (
                    <MenuItem key='goto' disabled={!(entity.enabled && this.props.ws !== entity.id)} className='property goTo'>
                        Go to Workingstep
                    </MenuItem>
                );

                toolInfo = (
                    <MenuItem key='tool' className='property toolInfo'>
                        Tool: {this.props.tools[entity.tool].name}
                    </MenuItem>
                );

                if (this.props.ws === entity.id) {
                    selectStep = <MenuItem disabled className='property'>
                        Status: Active
                    </MenuItem>;
                } else if (entity.enabled) {
                    selectStep = <MenuItem disabled className='property'>
                        Status: Inactive
                    </MenuItem>;
                } else {
                    selectStep = <MenuItem disabled className='property'>
                        Status: Disabled
                    </MenuItem>;
                }
                items = (
                    <Menu className='properties' onClick={(event) => {
                        this.selectWS(event, entity);
                    }}>
                        {selectStep}
                        {timeDistance}
                        {toolInfo}
                        {goToButton}
                    </Menu>
                );
                break;
            case 'workplan':
            case 'selective':
                items = (
                    <Menu className='properties'>
                        {timeDistance}
                        <MenuItem key='children' className='property children'>
                            <div className='title'>Children:</div>
                            <div className='list'>
                                {entity.children.map(this.renderNode)}
                            </div>
                        </MenuItem>
                    </Menu>
                );
                break;
            case 'tool':
                items = (
                    <Menu className='properties'>
                        {hasWorkingsteps
                            ? <MenuItem key='workingsteps' className='property children workingsteps'>
                                <div className='title'>
                                    Used in Workingsteps:
                                </div>
                                <div className='list'>
                                    {entity.workingsteps.map(this.renderNode)}
                                </div>
                            </MenuItem>
                                : <MenuItem key='workingsteps' className='property children workingsteps'>
                                    <div className='title'>
                                        Not used in any workingsteps.
                                    </div>
                                </MenuItem>
                        }
                    </Menu>
                );
                break;
            default:
                items = (
                    <Menu className='properties'>
                        <MenuItem disabled className='property'>
                            No information available
                        </MenuItem>
                    </Menu>
                );
        }

        return items;
    }

    render() {
        let entityName = ''
        let entityType = '';
        let paneName = 'properties-pane';
        let titleIcon = '';
        
        if (this.props.entity !== null) {
            entityName = this.props.entity.name;
            entityType = this.props.entity.type[0].toUpperCase() + this.props.entity.type.slice(1);
            paneName += ' visible';
            titleIcon = getIcon(this.props.entity.type);
        }

        return (
            <div className={paneName}>
                <div className='titlebar'>
                    <span className={titleIcon} />
                    <span className='title'>
                        <div className='type'>{entityType}</div>
                        <div className='name'>{entityName}</div>
                    </span>
                    <span 
                        className={getIcon('exit')}
                        onClick={(event) => {this.props.propertiesCb(null);}}
                    />
                </div>
                {this.renderProperties(this.props.entity)}
            </div>
        );
    }
}
