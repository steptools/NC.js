import React from 'react';
import Menu from 'rc-menu';
import _ from 'lodash';
var SubMenu = Menu.SubMenu;
var PlainMenuItem = Menu.Item;
import ReactTooltip from 'react-tooltip';

class MenuItem extends React.Component {
    render() {
        if (this.props.tooltip) {
            var id = _.uniqueId("tooltip_");
            return (
                <PlainMenuItem {...this.props}>
                    <div>
                        <span data-tip data-for={id}>
                            {this.props.children}
                        </span>
                        <ReactTooltip id={id} place="top" type="dark" effect="float" delayShow={this.props.delayShow}>
                            {this.props.tooltip}
                        </ReactTooltip>
                    </div>
                </PlainMenuItem>
            );
        } else {
            return (
                <PlainMenuItem {...this.props}>
                    <div>
                        {this.props.children}
                    </div>
                </PlainMenuItem>
            );
        }
    }
}

class SliderMenuItem extends React.Component {
    render() {
        return (
            <PlainMenuItem {...this.props}>
                <div>
                    {this.props.children}
                </div>
            </PlainMenuItem>
        )
    }
}

class ButtonImage extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (<div className={"button-icon glyphicons glyphicons-" + this.props.icon}/>);
    }
}

class Slider extends React.Component {
    constructor(props) {
        super(props);
        this.changed = this.changed.bind(this);
    }

    changed(info) {
        this.props.changed(info);
    }

    render() {
        var name = this.props.id.charAt(0).toUpperCase() + this.props.id.slice(1);
        if (this.props.left && this.props.right) {
            var left = this.props.left;
            var right = this.props.right;
            // TODO:Remove onMouseUp / onKeyUp if/when bug is fixed with onChange
            return (
                <div className="slider sliderWithIcons">
                    <input className={"range-" + this.props.id} onChange={this.changed} 
                        onMouseUp={this.changed} onKeyUp={this.changed} value={this.props.val} type="range" min={this.props.min} max={this.props.max} step="1"/>
                    <div className="sliderData">
                        <div className={"slider-icon slider-left-icon glyphicons glyphicons-" + left} onMouseUp={this.changed} onKeyUp={this.changed} value="0" />
                        <div className={"slider-text text-" + this.props.id}>{name}</div>
                        <div className={"slider-icon slider-right-icon glyphicons glyphicons-" + right} onMouseUp={this.changed} onKeyUp={this.changed} value="200" />
                    </div>
                </div>
            );
        } else {
            return (
                <div className="slider sliderNoIcons">
                    <input className={"range-" + this.props.id} onChange={this.changed} type="range" min="0" max="200" step="1" value={this.props.val}/>
                    <div className="sliderData">
                        <output className={"text-" + this.props.id}>{name}</output>
                    </div>
                </div>
            );
        }

    }
}

export default class HeaderView extends React.Component {
    constructor(props) {
        super(props);

        this.simulateMenuItemClicked = this.simulateMenuItemClicked.bind(this);
        this.updateSpeed = this.updateSpeed.bind(this);
    }

    updateSpeed(info) {
        this.props.actionManager.emit("simulate-setspeed", info);
    }

    simulateMenuItemClicked(info) {
        switch (info.key) {
            case "forward":
                this.props.actionManager.emit("sim-f");
                break;
            case "play":
                this.props.actionManager.emit("sim-pp");
                if (this.props.ppbutton == "play") {
                    this.props.cbPPButton("pause");
                } else {
                    this.props.cbPPButton("play");
                }
                break;
            case "backward":
                this.props.actionManager.emit("sim-b");
                break;
        }
    }

    render() {
        var ppbtntxt;
        var ppbutton = this.props.ppbutton;
        if (this.props.ppbutton === "play") {
            ppbtntxt = "Play";
        } else {
            ppbtntxt = "Pause";
        }
        const bottomMenu = (
            <Menu mode='horizontal' onClick={this.simulateMenuItemClicked} className='bottom-menu'>
                <MenuItem tooltip='Backward function is currently disabled' key='backward' ><ButtonImage icon='step-backward'/>Prev</MenuItem>
                <MenuItem key='play'><ButtonImage icon={ppbutton}/>{ppbtntxt}</MenuItem>
                <MenuItem key='forward'><ButtonImage icon='step-forward'/>Next</MenuItem>
                <SliderMenuItem key='speed'><Slider id='speed' changed={this.updateSpeed} val={this.props.speed} min="0" max="200" left="turtle" right="rabbit"/></SliderMenuItem>
            </Menu>
        );

        return <div className="header-bar">{bottomMenu}</div>;
    }
}
