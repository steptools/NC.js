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
        let name = type.replace(/_/g, ' ').toLowerCase();

        return name.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.slice(1);
        });
    }
    
    renderProperties(entity) {
        if (entity === null)
            return null;
        
        let items = null;
        
        switch (entity.type) {
            case 'tolerance':
                // TODO: show type of tolerance and value
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
                    <MenuItem className='property'>No information available</MenuItem>
                );
        }
        
        return items;
    }

    render(){
        let entityName = null;
        let visible = false;
        // TODO: get real icons for workingstep/workplan/tool
        
        if (this.props.entity !== null) {
            visible = true;
            
            if (this.props.entity.type === 'tolerance')
                entityName = this.formatToleranceName(this.props.entity.type);
            else {
                entityName = this.props.entity.name;
            }
        }
        
        return (
            <div className={'properties-pane' + (visible ? ' visible' : '')}>
                <div className='titlebar'>
                    <span className="exit glyphicons glyphicons-remove-sign"
                          onClick={this.props.clearEntity}></span>
                    <span className={'icon' + (visible ? ' ' + this.props.entity.type : '')}></span>
                    <div className='title'>#{visible ? this.props.entity.id : null}: {entityName} </div>
                </div>
                <Menu className='properties'>
                    {this.renderProperties(this.props.entity)}
                </Menu>
            </div>
        );
    }
}