import React from 'react';
import ReactDOM from 'react-dom';
import Menu from 'rc-menu';
import _ from 'lodash';

import ReactTooltip from 'react-tooltip';

//TODO: Should this be a xmlhttpreq?
var getppbtnstate = function() {
    return 'play';
}

class ButtonImage extends React.Component{
  constructor(props){
    super(props);
  }
  render(){
    var classes = 'button-icon glyphicon glyphicon-' + this.props.icon;
    if(this.props.onBtnClick)
      return (<div className={classes} onClick={this.props.onBtnClick}/>);
    return (<div className={classes}/>);
  }
}

export default class FooterView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {'ppbutton':getppbtnstate(),"wsid":-1,"wstext":""};
  this.btnClicked = this.btnClicked.bind(this);
  this.ffBtnClicked = this.ffBtnClicked.bind(this);
  this.bbBtnClicked = this.bbBtnClicked.bind(this);
  this.updateWorkingstep = this.updateWorkingstep.bind(this);
        let self = this;
        var playpause = ()=>{
            var xhr = new XMLHttpRequest();
            var url = "/v2/nc/projects/";
            url = url + this.props.pid + "/loop/";
            if(self.state.ppbutton ==='play'){
                ppstate('play');
                url = url+"start";
            }
            else{
                ppstate('pause');
                url = url+"stop";
            }
            xhr.open("GET", url, true);
            xhr.send(null);
        }
        var nextws = function(){
            var xhr = new XMLHttpRequest();
            var url = "/v2/nc/projects/"
            url = url + self.props.pid + "/loop/stepf";
            xhr.open("GET",url,true);
            xhr.send(null);
        }
        var prevws = function(){
            var xhr = new XMLHttpRequest();
            var url = "/v2/nc/projects/";
            url = url + self.props.pid + "/loop/stepb";
            xhr.open("GET",url,true);
            xhr.send(null);
        }
        var ppstate = (state) =>
        {
            var notstate;
            if(state==="play") notstate = "pause";
            else notstate = "play";
            self.setState({'ppbutton':notstate});
        };
  var ppBtnClicked = (info)=>{
      var cs = this.state.ppbutton;
      ppstate(cs);
      playpause();
  };
  var fBtnClicked = (info)=>{
      nextws();
  }
  var bBtnClicked = (info)=>{
      prevws();
  }
        ppstate = ppstate.bind(this);
  ppBtnClicked = ppBtnClicked.bind(this);
  fBtnClicked = fBtnClicked.bind(this);
  bBtnClicked = bBtnClicked.bind(this);

  this.props.socket.on("nc:state",(state)=>{ppstate(state)});

  this.props.actionManager.on('sim-pp',ppBtnClicked);
  this.props.actionManager.on('change-workingstep', this.updateWorkingstep);
  this.props.actionManager.on('sim-f',fBtnClicked)
  this.props.actionManager.on('sim-b',bBtnClicked)
    }

    componentDidMount() {
        var xhr = new XMLHttpRequest();
        var self = this;
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    if(xhr.responseText =="play")
                        self.setState({"ppbutton": "pause"}); //Loop is running, we need a pause button.
                    else
                        self.setState({"ppbutton":"play"});
                }
            }
        };
        var url = "/v2/nc/projects/"
        url = url + this.props.pid + "/loop/state";
        xhr.open("GET", url, true);
        xhr.send(null);
    }

    btnClicked(info){
      this.props.actionManager.emit('sim-pp');
    }
    ffBtnClicked(info){
      this.props.actionManager.emit('sim-f');
    }
    bbBtnClicked(info){
      this.props.actionManager.emit('sim-b');
    }
    updateWorkingstep(ws){
      var self = this;
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = ()=>{
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            if(xhr.responseText)
            {
              var workingstep = JSON.parse(xhr.responseText);
              self.setState({"wsid": workingstep.id,"wstext":workingstep.name.trim()});
            }
            else
              self.setState({"wsid":ws,"wstxt":"Operation Unknown"});
          }
        }
      };
      var url = "/v2/nc/projects/";
      url = url + this.props.pid + "/workplan/" + ws;
      xhr.open("GET",url,true);
      xhr.send(null);
    }
    render() {
        if(this.props.guiMode == 0)
            return null;
        var ppbtntxt = this.state.ppbutton;
    return <div className="Footer-bar">
      <div className="op-text">{this.state.wstext}</div>
      <ButtonImage onBtnClick={this.bbBtnClicked} icon="step-backward"/>
      <ButtonImage onBtnClick={this.btnClicked} icon={ppbtntxt}/>
      <ButtonImage onBtnClick={this.ffBtnClicked} icon="step-forward"/>
      </div>;
    }
}
