import React from 'react';
import ReactDOM from 'react-dom';
import Menu from 'rc-menu';
import _ from 'lodash';
import request from 'superagent';
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

        let tempGuiMode=1;
        if((window.innerWidth-390 > window.innerHeight) && (window.innerWidth > 800))
            tempGuiMode=0;

        this.state = {
            guiMode: tempGuiMode,
            svmode: 'tree',
            ws: -1,
            svtree: {
                "name": "No Project Loaded",
                "isLeaf": true
            },
            svaltmenu: '',
            wstext: '',
            ppbutton: 'play',
            resize: false
        };

        this.ppstate = this.ppstate.bind(this);
        this.ppBtnClicked = this.ppBtnClicked.bind(this);
        this.fBtnClicked = this.fBtnClicked.bind(this);
        this.bBtnClicked = this.bBtnClicked.bind(this);

        this.props.app.socket.on("nc:state",(state)=>{this.ppstate(state)});

        this.props.app.actionManager.on('sim-pp',this.ppBtnClicked);
        this.props.app.actionManager.on('sim-f',this.fBtnClicked);
        this.props.app.actionManager.on('sim-b',this.bBtnClicked);


        this.updateWorkingstep = this.updateWorkingstep.bind(this);

        this.handleResize   = this.handleResize.bind(this);
        this.props.app.actionManager.on('change-workingstep', this.updateWorkingstep);

        this.sidebarCBMode=this.sidebarCBMode.bind(this);
        this.sidebarCBTree=this.sidebarCBTree.bind(this);
        this.sidebarCBAltMenu=this.sidebarCBAltMenu.bind(this);
        this.cbWS=this.cbWS.bind(this);
        this.footerCBWSText=this.footerCBWSText.bind(this);
        this.cbPPButton=this.cbPPButton.bind(this);

        this.speedChanged = this.speedChanged.bind(this);
        this.changeSpeed = this.changeSpeed.bind(this);

        this.props.app.actionManager.on("simulate-setspeed", this.changeSpeed);
        this.props.app.socket.on("nc:speed",(speed)=>{this.speedChanged(speed);});
    }

    componentDidMount() {
        window.addEventListener("resize", this.handleResize);

        let xhr = new XMLHttpRequest();
        let self = this;
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    let stateObj = JSON.parse(xhr.responseText);
                    if(stateObj.state =="play")
                        self.setState({"ppbutton": "pause"}); //Loop is running, we need a pause button.
                    else
                        self.setState({"ppbutton":"play"});

                    self.setState({"playbackSpeed": Number(stateObj.speed)});
                }
            }
        };

        let url = "/v2/nc/projects/";
        url = url + this.props.pid + "/state/loop/";
        xhr.open("GET", url, true);
        xhr.send(null);

        this.setState({"changeSpeed": false});
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
        let self = this;
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = ()=>{
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    if(xhr.responseText)
                    {
                        let workingstep = JSON.parse(xhr.responseText);
                        self.setState({"ws": workingstep.id,"wstext":workingstep.name.trim()});
                    }
                    else
                        self.setState({"ws":ws,"wstxt":"Operation Unknown"});
                }
            }
        };
        let url = "/v2/nc/projects/";
        url = url + this.props.pid + "/workplan/" + ws;
        xhr.open("GET",url,true);
        xhr.send(null);
    }

    playpause(){
        let xhr = new XMLHttpRequest();
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
        xhr.open("GET", url, true);
        xhr.send(null);
    }
    nextws(){
        let xhr = new XMLHttpRequest();
        let url = "/v2/nc/projects/"
        url = url + this.props.pid + "/state/ws/next";
        xhr.open("GET",url,true);
        xhr.send(null);
    }
    prevws(){
        let xhr = new XMLHttpRequest();
        let url = "/v2/nc/projects/";
        url = url + this.props.pid + "/state/ws/prev";
        xhr.open("GET",url,true);
        xhr.send(null);
    }
    ppstate(){
        let notstate;
        if(this.state==="play") notstate = "pause";
        else notstate = "play";
        this.setState({'ppbutton':notstate});
    }
    ppBtnClicked(info){
        let cs = this.state.ppbutton;
        this.ppstate(cs);
        this.playpause();
    }
    fBtnClicked(info){
        this.nextws();
    }
    bBtnClicked(info){
        this.prevws();
    }

    sidebarCBMode(newMode)
    {
        this.setState({ svmode: newMode });
    }

    sidebarCBTree(newTree)
    {
        this.setState({ svtree: newTree });
    }

    sidebarCBAltMenu(newAltMenu)
    {
        this.setState({ svaltmenu: newAltMenu });
    }

    cbWS(newWS)
    {
        this.setState({ ws: newWS });
    }

    footerCBWSText(newWSText)
    {
        this.setState({ wstext: newWSText });
    }

    cbPPButton(newPPButton)
    {
        this.setState({ ppbutton: newPPButton });
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

        // set the value itself
        this.setState({'playbackSpeed': Number(speed)});

        if (event.type === 'change') {
            return; // we don't want to commit anything until some other type of event
        }
        
        // tell the client to wait for server speed to catch up
        this.setState({'changeSpeed': true});

        // now send a request to the server to change its speed
        let xhr = new XMLHttpRequest();
        let url = "/v2/nc/projects/" + this.props.pid + "/state/loop/" + Number(speed);
        xhr.open("GET", url, true);
        xhr.send(null);

    }

    render() {
        let HV, SV, FV;
        if(this.state.guiMode == 0) {
            HV = <HeaderView
                cadManager={this.props.app.cadManager}
                actionManager={this.props.app.actionManager}
                socket={this.props.app.socket}
                cbPPButton={this.cbPPButton}
                ppbutton={this.state.ppbutton}
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
                cbMode={this.sidebarCBMode}
                cbWS={this.cbWS}
                cbTree={this.sidebarCBTree}
                cbAltMenu={this.sidebarCBAltMenu}
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
                cbWSText={this.footerCBWSText}
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
                'top': '94px',
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
