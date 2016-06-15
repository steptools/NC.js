import React from 'react';
import Menu from 'rc-menu';
import _ from 'lodash';
var SubMenu = Menu.SubMenu;
var PlainMenuItem = Menu.Item;
import ReactTooltip from 'react-tooltip';
require('./header.scss');

class MenuItem extends React.Component {
    render() {
        if (this.props.tooltip) {
            var id = _.uniqueId("tooltip_");
            return (
                <PlainMenuItem {...this.props}>
                    <span data-tip data-for={id}>
                        {this.props.children}
                    </span>
                    <ReactTooltip id={id} place="top" type="dark" effect="float" delayShow={this.props.delayShow}>
                        {this.props.tooltip}
                    </ReactTooltip>
                </PlainMenuItem>
            );
        } else {
            return (
                <PlainMenuItem {...this.props}>
                    {this.props.children}
                </PlainMenuItem>
            );
        }
    }
}

class ButtonImage extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        var classes = 'button-icon glyphicon glyphicon-' + this.props.icon;
        return (
            <div>
                <div className={classes}/>
            </div>
        );
    }
}

class Slider extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        var sliderId = 'range-' + this.props.id;
        var textId = 'text-' + this.props.id;
        return (
            <div>
                <input className={sliderId} type="range" min="0" max="100" step="1"/>
                <output className={textId}>50</output>
            </div>
        );
    }
}

export default class HeaderView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'openMenu': 'file-menu'
        };
        this.openBottomMenu = this.openBottomMenu.bind(this);
        this.debugMenuItemClicked = this.debugMenuItemClicked.bind(this);
        this.fileMenuItemClicked = this.fileMenuItemClicked.bind(this);
        this.simulateMenuItemClicked = this.simulateMenuItemClicked.bind(this);
        this.viewMenuItemClicked = this.viewMenuItemClicked.bind(this);

        let self = this;
        var playpause = function() {
            var xhr = new XMLHttpRequest();
            var url = "/v2/nc/boxy/loop/";
            if (self.state.ppbutton === 'play') {
                ppstate('play');
                url = url + "start";
            } else {
                ppstate('pause');
                url = url + "stop";
            }
            xhr.open("GET", url, true);
            xhr.send(null);
        }
        
        var ppstate = (state) => {
            var notstate;
            if (state === "play") 
                notstate = "pause";
            else 
                notstate = "play";
            self.setState({'ppbutton': notstate});
        };
        ppstate = ppstate.bind(this);
        
        this.props.actionManager.on('simulate-play', playpause);
        this.props.actionManager.on('simulate-pause', playpause);
        this.props.socket.on("nc:state", (state) => {
            ppstate(state);
        });
        
        var setSpeed = function(){
            var xhr = new XMLHttpRequest();
            var url = "/v2/nc/projects/boxy/loop/speed/";
            var newSpeed = self.state.playbackSpeed + 0.5;  // needs to be updated for slider
            url = url+newSpeed;
            self.setState({'playbackSpeed': newSpeed});
            xhr.open("GET", url, true);
            xhr.send(null);
        };
        
        var speedState = (speed) =>
        {
            self.setState({'playbackSpeed': Number(speed)});
        };

        this.props.actionManager.on('simulate-setspeed',setSpeed);
        this.props.socket.on("nc:speed",(speed)=>{speedState(speed);});
    }

    openBottomMenu(info) {
        this.setState({'openMenu': info.key});
    }

    debugMenuItemClicked(info) {
        if (info.key == "db1") {
            this.props.socket.emit('req:modeltree', "moldy");
        } else if (info.key == "db2") {
            this.props.socket.emit('req:projects');
        }
    }

    fileMenuItemClicked(info) {
        switch (info.key) {
            case "new":
                this.props.actionManager.emit("open-new-project-menu");
                break;
            case "save":
                this.props.actionManager.emit("open-save-project-menu");
                break;
            case "load":
                this.props.actionManager.emit("open-load-project-menu");
                break;
            case "speed":
                this.props.actionManager.emit("update-speed");
                break;
        }
    }

    simulateMenuItemClicked(info) {
        console.log(info);
        switch (info.key) {
            case "forward":
                this.props.actionManager.emit("simulate-forward");
                break;
            case "play":
                this.props.actionManager.emit("simulate-play");
                break;
            case "backward":
                this.props.actionManager.emit("simulate-backward");
                break;
            case "remote-session":
                this.props.ActionManager.emit("simulate-remote-session");
                break;
        }
    }

    viewMenuItemClicked(info) {
        switch (info.key) {
            case "toleranceTree":
                this.props.actionManager.emit("open-tolerance-tree");
                break;
        }
    }

    componentDidMount() {
        var xhr = new XMLHttpRequest();
        var self = this;
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    if (xhr.responseText == "play") 
                        self.setState({"ppbutton": "pause"}); //Loop is running, we need a pause button.
                    else 
                        self.setState({"ppbutton": "play"});
                    }
                }
        };
        var url = "/v2/nc/projects/boxy/loop/state";
        xhr.open("GET", url, true);
        xhr.send(null);
        
        // Send a request to get the current speed
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    self.setState({"playbackSpeed": Number(xhr.responseText)});
                }
            }
        };
        url = "/v2/nc/projects/boxy/loop/speed";
        xhr.open("GET", url, true);
        xhr.send(null);
    }

    render() {
        if (this.props.guiMode == 1) 
            return null;
        const topMenu = (
            <Menu mode='horizontal' onClick={this.openBottomMenu} className='top-menu'>
                <MenuItem key='file-menu'>File</MenuItem>
                <MenuItem key='simulate-menu'>Simulate</MenuItem>
            </Menu>
        );
        const bottomMenu = (
            <div className='bottom-menus'>
                {this.state.openMenu == 'file-menu'
                    ? <Menu mode='horizontal' onClick={this.fileMenuItemClicked} className='bottom-menu'>
                            <MenuItem tooltip='New function is currently disabled' key='new'><ButtonImage icon='file'/>New</MenuItem>
                            <MenuItem tooltip='Save function is currently disabled' key='save'><ButtonImage icon='save'/>Save</MenuItem>
                            <MenuItem key='load'><ButtonImage icon='open-file'/>Load</MenuItem>
                        </Menu>
                    : null}
                {this.state.openMenu == 'simulate-menu'
                    ? <Menu mode='horizontal' onClick={this.simulateMenuItemClicked} className='bottom-menu'>
                            <MenuItem tooltip='Disabled' key='backward'><ButtonImage icon='backward'/>Prev</MenuItem>
                            <MenuItem tooltip='Disabled' key='play'><ButtonImage icon='play'/>Play</MenuItem>
                            <MenuItem tooltip='Disabled' key='forward'><ButtonImage icon='forward'/>Next</MenuItem>
                            <MenuItem tooltip='Disabled' key='speed'><Slider id='speed'/>Speed</MenuItem>
                        </Menu>
                    : null}
            </div>
        );
        return <div className="header-bar">
            <div>{topMenu}</div>
            <div>{bottomMenu}</div>
        </div>;
    }
}
