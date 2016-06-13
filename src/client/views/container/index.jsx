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

        //0 is desktop, 1 is mobile
        if($(this.ie6 ? document.body : document).width()>$(this.ie6 ? document.body : document).height())
            this.state = { guiMode: 0 };
        else
            this.state = { guiMode: 1 };

        this.handleResize   = this.handleResize.bind(this);
        window.addEventListener("resize", this.handleResize);
    }

    handleResize() {
        if($(this.ie6 ? document.body : document).width()>$(this.ie6 ? document.body : document).height())
            this.setState({ guiMode: 0 });
        else
            this.setState({ guiMode: 1 });
    }
    
    render() {   
	return(
	    <div style={{height:'100%'}}>
		<HeaderView
		    cadManager={this.props.app.cadManager}
		    actionManager={this.props.app.actionManager}
		    socket={this.props.app.socket}
		    guiMode={this.state.guiMode}
		    />
		<SidebarView
		    cadManager={this.props.app.cadManager}
		    app={this.props.app}
		    actionManager={this.props.app.actionManager}
		    socket={this.props.app.socket}
		    guiMode={this.state.guiMode}
		    />
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
		    guiMode={this.state.guiMode}
		    />
	    </div>
	);
    }
}
