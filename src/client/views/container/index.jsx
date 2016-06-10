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
        this.handleResize   = this.handleResize.bind(this);
        window.addEventListener("resize", this.handleResize);
    }

    handleResize() {
        this.setState({ key: Math.random() });
    }
    
    render() {   
        if($(this.ie6 ? document.body : document).width()>$(this.ie6 ? document.body : document).height())
	    {
		//desktop probably
		return(
			<div style={{height:'100%'}}>
			    <HeaderView
			      cadManager={this.props.app.cadManager}
			      actionManager={this.props.app.actionManager}
			      socket={this.props.app.socket}
			      />
			    <SidebarView
			      cadManager={this.props.app.cadManager}
			      app={this.props.app}
			      actionManager={this.props.app.actionManager}
			      socket={this.props.app.socket}
			      />
			    <div id='cadview-container'>
				<CADView
			    manager={this.props.app.cadManager}
				viewContainerId='primary-view'
				root3DObject={this.props.app._root3DObject}
				/>
			    </div>
			</div>
		);
	    }
	    else
	    {
		//mobile probably
		return(
			<div style={{height:'100%'}}>
			    <div id='cadview-container'>
				<CADView
				manager={this.props.app.cadManager}
				viewContainerId='primary-view'
				root3DObject={this.props.app._root3DObject}
				/>
			    </div>
			    <FooterView 
				cadManager={this.props.app.cadManager}
				actionManager={this.props.app.actionManager}
				socket={this.props.app.socket}
			      />
			</div>
		);
	    }
    }
}
