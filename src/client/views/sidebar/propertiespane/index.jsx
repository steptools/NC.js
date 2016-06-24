import React from 'react';
import Menu from 'rc-menu';
import request from 'superagent';

let MenuItem = Menu.Item;

export default class PropertiesPane extends React.Component {
    constructor(props){
        //Create the constructor for the component
        super(props);
    }

    componentDidMount(){
      
    }

    componentWillUpdate(nextProps, nextState) {
        //TODO: collect more information via GET if necessary
    }

    formatToleranceName(type) {

        return type.charAt(0).toUpperCase() + type.slice(1) + ' Tolerance';
    }
    
    renderProperties(entity) {
        console.log(entity);
        
        let items=null;

        if (entity === null)
            return null;

        switch (entity.type) {
            case 'tolerance':
                // TODO: add more tolerance properties
                items = (
                    <Menu className='properties'>
                        <MenuItem className='property'>{entity.toleranceType}</MenuItem>
                        <MenuItem className='property'>Value: {entity.value}</MenuItem>
                    </Menu>
                );
                break;
            case 'workingstep':
                // TODO: show workingstep properties
                break;
            case 'workplan':
                // not sure if we want to do anything for this
                break;
            case 'tool':
                // no support yet
                break;
            default:
                items = (
                    <Menu className='properties'>
                        <MenuItem className='property'>No information available</MenuItem>
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