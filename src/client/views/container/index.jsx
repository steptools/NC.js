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
        if((window.innerWidth-390 > window.innerHeight) && (window.innerWidth > 800))
            this.state = { guiMode: 0 };
        else
            this.state = { guiMode: 1 };
        
        this.handleResize   = this.handleResize.bind(this);
        
		this.speedChanged = this.speedChanged.bind(this);
        this.changeSpeed = this.changeSpeed.bind(this);
        
        this.props.app.actionManager.on("simulate-setspeed", this.changeSpeed);
        this.props.app.socket.on("nc:speed",(speed)=>{this.speedChanged(speed);});
    }

    componentDidMount() {
        window.addEventListener("resize", this.handleResize);
        
        var self = this;
        
        // Send a request to get the current speed
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    self.setState({"playbackSpeed": Number(xhr.responseText)});
                }
            }
        };
        var url = "/v2/nc/projects/boxy/loop/speed";
        xhr.open("GET", url, true);
        xhr.send(null);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.handleResize);
    }

    handleResize() {
        if((window.innerWidth-390 > window.innerHeight) && (window.innerWidth > 800))
            this.setState({ guiMode: 0 });
        else
            this.setState({ guiMode: 1 });
    }
    
    speedChanged(speed) {
        // console.log("speed changed: " + speed);

        this.setState({'playbackSpeed': Number(speed)});
    }
    
	changeSpeed(speed) {
        // console.log("changing speed: " + speed);
        
        var xhr = new XMLHttpRequest();
        var url = "/v2/nc/projects/boxy/loop/speed/";
        var newSpeed = Number(speed);
        url = url + newSpeed;
        xhr.open("GET", url, true);
        xhr.send(null);
        
    }

    render() {   
	return(
	    <div style={{height:'100%'}}>
		<HeaderView
		    cadManager={this.props.app.cadManager}
		    actionManager={this.props.app.actionManager}
		    socket={this.props.app.socket}
		    guiMode={this.state.guiMode}
            speed={this.state.playbackSpeed}
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
			guiMode={this.state.guiMode}
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
