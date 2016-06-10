import React from 'react';
import ReactDOM from 'react-dom';
import Menu from 'rc-menu';
import _ from 'lodash';
import BrowserView          from '../browser';
import LoginView            from '../user/login';
import RegisterView         from '../user/register';
import CADView              from '../cad';
import HeaderView           from '../header';
import SidebarView          from '../sidebar';
import FooterView	    from '../footer';

import ReactTooltip from 'react-tooltip';

export default class ContainerView extends React.Component {
    constructor(props){
        super(props);

        this.state={
            update: false
        };

        this.handleResize   = this.handleResize.bind(this);
        window.addEventListener("resize", this.handleResize);
    }

    handleResize() {
        this.setState({ update: !this.state.update });
    }
    
    render() {   
        var HV=($(this.ie6 ? document.body : document).width()>$(this.ie6 ? document.body : document).height())? <HeaderView
	    cadManager={this.props.app.cadManager}
	    actionManager={this.props.app.actionManager}
	    socket={this.props.app.socket}
	    />:undefined;
	var SV=($(this.ie6 ? document.body : document).width()>$(this.ie6 ? document.body : document).height())? <SidebarView
	    cadManager={this.props.app.cadManager}
	    app={this.props.app}
	    actionManager={this.props.app.actionManager}
	    socket={this.props.app.socket}
	    />:undefined;
	var FV=($(this.ie6 ? document.body : document).width()>$(this.ie6 ? document.body : document).height())? undefined:<FooterView 
	    cadManager={this.props.app.cadManager}
	    actionManager={this.props.app.actionManager}
	    socket={this.props.app.socket}
	     />;
	return(
	    <div style={{height:'100%'}}>
		{HV}
		{SV}
		<div id='cadview-container'>
		    <CADView
			manager={this.props.app.cadManager}
			viewContainerId='primary-view'
			root3DObject={this.props.app._root3DObject}
			/>
		</div>
		{FV}
	    </div>
	);
    }
}
