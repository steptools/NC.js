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
        if (nextProps.entity !== null) {
            request.url("/v2/nc/projects"+this.props.pid+"/")
        }
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
        let entityName;
        if (this.props.entity !== null) {
            if (this.props.entity.type === 'tolerance')
                entityName = this.formatToleranceName(this.props.entity.type);
            else
                entityName = this.props.entity.name;
        }
        
        let visible = false;
        if (this.props.entity !== null)
            visible = true;
        
        return (
            <div className={'properties-pane' + (visible ? ' visible' : '')}>
                <div className='titlebar'>
                    <span className='icon'></span>
                    <span className = 'title'> #{visible ? this.props.entity.id : null}: {entityName} </span>
                    <span className="exit glyphicons glyphicons-remove-sign"
                        onClick={this.props.clearEntity}></span>
                </div>
                <Menu className='properties'>
                    {this.renderProperties(this.props.entity)}
                </Menu>
            </div>
        );
    }
}