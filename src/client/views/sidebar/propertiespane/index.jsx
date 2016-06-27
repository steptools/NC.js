import React from 'react';
import Menu from 'rc-menu';
import request from 'superagent';

let MenuItem = Menu.Item;

export default class PropertiesPane extends React.Component {
    constructor(props){
        //Create the constructor for the component
        super(props);
        
        this.selectWS = this.selectWS.bind(this);
    }

    componentDidMount(){
      
    }

    componentWillUpdate(nextProps, nextState) {
        //TODO: collect more information via GET if necessary
    }

    formatToleranceName(type) {

        return type.charAt(0).toUpperCase() + type.slice(1) + ' Tolerance';
    }

    selectWS(event, ws) {
        if (event.key='goto') {
            let url = '/v2/nc/projects/' + this.props.pid + '/state/ws/' + ws.id;
            console.log(event);
            request
                .get(url)
                .end(function (err, res) {
                    //
                });
        } 
        else {
            // some other menu item clicked, no need to do anything
        }
    }
    
    renderProperties(entity) {
        let items=null;

        if (entity === null)
            return null;

        switch (entity.type) {
            case 'tolerance':
                // TODO: add more tolerance properties
                items = (
                    <Menu className='properties'>
                        <MenuItem disabled className='property'>{entity.toleranceType}</MenuItem>
                        <MenuItem disabled className='property'>Value: {entity.value}</MenuItem>
                    </Menu>
                );
                break;
            case 'workingstep':
                let selectStep, goToButton;
                
                goToButton = (<MenuItem
                    disabled={!(entity.enabled && this.props.ws !== entity.id)}
                    className='property goTo'>Go to Workingstep</MenuItem>);
                
                if (this.props.ws === entity.id) {
                    selectStep = <MenuItem disabled className='property'>Status: Active</MenuItem>;
                }
                else if (entity.enabled) {
                    selectStep = <MenuItem disabled className='property'>Status: Inactive</MenuItem>
                }
                else {
                    selectStep = <MenuItem disabled className='property'>Status: Disabled</MenuItem>
                }
                items = (
                    <Menu className='properties' onSelect={(event) => {this.selectWS(event, entity);}}>
                        {selectStep}
                        {goToButton}
                    </Menu>
                );
                break;
            case 'workplan':
                // not sure if we want to do anything for this
            case 'tool':
                // no support yet
            default:
                items = (
                    <Menu className='properties'>
                        <MenuItem disabled className='property'>No information available</MenuItem>
                    </Menu>
                );
        }
        
        return items;
    }

    render(){
        let entityName = null;
        let visible = false;
        // TODO: get real icons for workingstep/workplan/tool
        
        let tolType = '';
        
        if (this.props.entity !== null) {
            visible = true;
            
            if (this.props.entity.type === 'tolerance') {
                entityName = this.formatToleranceName(this.props.entity.toleranceType);
                tolType = 'tolerance-' + this.props.entity.toleranceType;
            }
            else {
                entityName = this.props.entity.name;
            }
        }
        
        return (
            <div className={'properties-pane' + (visible ? ' visible' : '')}>
                <div className='titlebar'>
                    <span className="exit glyphicons glyphicons-remove-sign"
                          onClick={this.props.clearEntity}></span>
                    <span className={'icon' + (visible ? ' ' + this.props.entity.type + ' ' + tolType : '')}></span>
                    <div className='title'>#{visible ? this.props.entity.id : null}: {entityName} </div>
                </div>
                {this.renderProperties(this.props.entity)}
            </div>
        );
    }
}