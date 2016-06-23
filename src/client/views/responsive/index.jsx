import React from 'react';
import ReactDOM from 'react-dom';
import Menu from 'rc-menu';
import _ from 'lodash';
import request from 'superagent';
import CADView              from '../cad';
import HeaderView           from '../header';
import SidebarView          from '../sidebar';
import FooterView	    from '../footer';

import ReactTooltip from 'react-tooltip';

export default class ResponsiveView extends React.Component {
    constructor(props){
        super(props);

        let tempGuiMode=1;
        if((window.innerWidth-390 > window.innerHeight) && (window.innerWidth > 800))
            tempGuiMode=0;

        this.state = {
            guiMode: tempGuiMode,
            svmode: 'ws',
            ws: -1,
            svtree: {
                "name": "No Project Loaded",
                "isLeaf": true
            },
            svaltmenu: '',
            wstext: '',
            ppbutton: 'play',
            logstate : false,
            resize: false,
            changeSpeed: false,
            playbackSpeed: 50
        };

        this.ppstate = this.ppstate.bind(this);
        this.ppBtnClicked = this.ppBtnClicked.bind(this);

        this.props.app.socket.on("nc:state",(state)=>{this.ppstate(state)});

        this.props.app.actionManager.on('sim-pp', this.ppBtnClicked);
        this.props.app.actionManager.on('sim-f',(info) => {console.log(this); this.nextws()});
        this.props.app.actionManager.on('sim-b',(info) => {this.prevws()});

        this.updateWorkingstep = this.updateWorkingstep.bind(this);

        this.handleResize   = this.handleResize.bind(this);
        this.props.app.actionManager.on('change-workingstep', this.updateWorkingstep);

        this.cbWS=this.cbWS.bind(this);

        this.speedChanged = this.speedChanged.bind(this);
        this.changeSpeed = this.changeSpeed.bind(this);

        this.props.app.actionManager.on("simulate-setspeed", this.changeSpeed);
        this.props.app.socket.on("nc:speed",(speed)=>{this.speedChanged(speed);});
    }
    
    

    componentDidMount() {
        window.addEventListener("resize", this.handleResize);
    }

    componentWillMount() {
        let url = "/v2/nc/projects/";
        url = url + this.props.pid + "/state/loop/";
        
        let requestCB = function(error, response) {
            if (!error && response.ok) {
                let stateObj = JSON.parse(response.text);
                
                if(stateObj.state === "play")
                    this.setState({"ppbutton": "pause"}); //Loop is running, we need a pause button.
                else
                    this.setState({"ppbutton":"play"});

                this.setState({"playbackSpeed": Number(stateObj.speed)});
            }
        };
        
        requestCB = requestCB.bind(this);
        
        request.get(url).end(requestCB);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.handleResize);
    }

    handleResize() {
        if((window.innerWidth-390 > window.innerHeight) && (window.innerWidth > 800))
            this.setState({ guiMode: 0 });
        else
            this.setState({ guiMode: 1 });
        
        this.setState({resize: true});
        this.setState({resize: false});
    }

    updateWorkingstep(ws){
        let url = "/v2/nc/projects/";
        url = url + this.props.pid + "/workplan/" + ws;
        
        let requestCB = function(error, response) {
            if (!error && response.ok) {
                if (response.text) {
                    let workingstep = JSON.parse(response.text);
                    this.setState({"ws": workingstep.id, "wstext":workingstep.name.trim()});
                }
                else
                    this.setState({"ws":ws,"wstxt":"Operation Unknown"});
            }
        };
        
        requestCB = requestCB.bind(this);
        
        request.get(url).end(requestCB);
    }

    playpause(){
        let url = "/v2/nc/projects/";
        url = url + this.props.pid + "/state/loop/";
        if(this.state.ppbutton ==='play'){
            this.ppstate('play');
            url = url+"start";
        }
        else{
            this.ppstate('pause');
            url = url+"stop";
        }
        request.get(url).end((res) => {});
    }
    nextws(){
        let url = "/v2/nc/projects/"
        url = url + this.props.pid + "/state/ws/next";
        request.get(url).end((res) => {});
    }
    prevws(){
        let url = "/v2/nc/projects/"
        url = url + this.props.pid + "/state/ws/prev";
        request.get(url).end((res) => {});
    }
    ppstate(state){
        let notstate;
        if(state==="play") notstate = "pause";
        else notstate = "play";
        this.setState({'ppbutton':notstate});
    }
    ppBtnClicked(info){
        let cs = this.state.ppbutton;
        this.ppstate(cs);
        this.playpause();
    }

    cbWS(newWS)
    {
        this.setState({ ws: newWS });
    }

    speedChanged(speed) {
        if (!this.state.changeSpeed) {
            // just update to match server
            this.setState({'playbackSpeed': Number(speed)});
        }
        else if (this.state.playbackSpeed === Number(speed)) {
            // server speed matches client speed now
            this.setState({'changeSpeed': false});
        }
        else
            ;// something didn't match up, wait for the proper server response
    }

	changeSpeed(event) {

        let speed = event.target.value;

        if (!speed) {
            speed = event.target.attributes.value.value;
        }

        // set the value itself
        this.setState({'playbackSpeed': Number(speed)});

        if (event.type === 'change') {
            return; // we don't want to commit anything until some other type of event
        }
        
        // tell the client to wait for server speed to catch up
        this.setState({'changeSpeed': true});

        // now send a request to the server to change its speed
        let url = "/v2/nc/projects/" + this.props.pid + "/state/loop/" + Number(speed);
        request.get(url).end(() => {});
    }

    render() {
        let HV, SV, FV;
        if(this.state.guiMode == 0) {
            HV = <HeaderView
                cadManager={this.props.app.cadManager}
                actionManager={this.props.app.actionManager}
                socket={this.props.app.socket}
                cbPPButton={
                    (newPPButton) => {this.setState({ ppbutton: newPPButton })}
                }
                cbLogstate = {
                    (newlogstate) => {this.setState({logstate: newlogstate})}
                }
                ppbutton={this.state.ppbutton}
                logstate={this.state.logstate}
                speed={this.state.playbackSpeed}
                pid={this.props.pid}
            />;
            SV = <SidebarView
                cadManager={this.props.app.cadManager}
                app={this.props.app}
                actionManager={this.props.app.actionManager}
                socket={this.props.app.socket}
                mode={this.state.svmode}
                ws={this.state.ws}
                tree={this.state.svtree}
                altmenu={this.state.svaltmenu}
                cbMode={
                    (newMode) => {this.setState({ svmode: newMode })}
                }
                cbWS={this.cbWS}
                cbTree={
                    (newTree) => {this.setState({ svtree: newTree })}
                }
                cbAltMenu={
                    (newAltMenu) => {this.setState({ svaltmenu: newAltMenu })}
                }
                pid={this.props.pid}
            />;
        }
        else {
            FV = <FooterView
                cadManager={this.props.app.cadManager}
                actionManager={this.props.app.actionManager}
                socket={this.props.app.socket}
                wsid={this.state.ws}
                wstext={this.state.wstext}
                cbWS={this.cbWS}
                cbWSText={
                    (newWSText) => {this.setState({ wstext: newWSText })}
                }
                ppbutton={this.state.ppbutton}
                pid={this.props.pid}
            />;
        }

        let cadview_bottom, cadview_style;
        
        if (navigator.userAgent.match(/iPhone|iPad|iPod/i)
            || (navigator.userAgent.indexOf("Chrome") === -1
                && navigator.userAgent.indexOf("Safari") !== -1)) {
            cadview_bottom = '10vmin';
        }
        else {
            cadview_bottom = '0px';
        }
        
        // squish the cad view down to appropriate size
        if (this.state.guiMode === 0) {
            cadview_style =
            {
                'left': '390px',
                'top': '90px',
                'bottom': '0px',
                'right': '0px'
            };
        }
        else {
            cadview_style =
            {
                'bottom': cadview_bottom,
                'right': '0px',
                'width': '100%',
                'top': '0px'
            };
        }

        return(
	    <div style={{height:'100%'}}>
		{HV}
		{SV}
		<div id='cadview-container' style={cadview_style}>
		    <CADView
			manager={this.props.app.cadManager}
			viewContainerId='primary-view'
			root3DObject={this.props.app._root3DObject}
			guiMode={this.state.guiMode}
            resize={this.state.resize}
			/>
		</div>
		{FV}
	    </div>
	);
    }
}
