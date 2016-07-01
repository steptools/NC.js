"use-strict";

import React from 'react';

function getNodeIcon(node) {
    if (node.type === "workplan") {
        return <span className="icon-workplan glyphicons glyphicons-cube-empty"/>
    } else if (node.type === "selective") {
        return <span className="icon-workplan glyphicons glyphicons-list-numbered"/>
    } else {
        return <span className="icon-workplan glyphicons glyphicons-blacksmith"/>
    }
}

const Container = (props) => {
    console.log(props);
    let node = props.node;
    node.icon = getNodeIcon(node);
    let cName = "node";
    if (node.id === node.ws) {
        cName = "node running-node";
    } else if (node.enabled === false) {
        cName = "node disabled";
    }
    
    console.log(props);
    return (
        <span
            id={node.id}
            className={cName}
            onClick={node.propertyCb(node)}
        >
            {node.icon}
            <span className="node-text">
                {node.name}
            </span>
        </span>
    );
}

const decorators = {
    Container
}

const style_default = {
    tree: {
        base: {
            listStyle: 'none',
            backgroundColor: '#21252B',
            margin: 0,
            padding: '2px',
            overflowY: 'scroll',
            maxHeight: 'inherit',
            color: '#9DA5AB'
        },
        node: {
            base: {
                position: 'relative'
            },
            link: {
                cursor: 'pointer',
                position: 'relative',
                padding: '0px 5px',
                display: 'block'
            },
            activeLink: {
                background: '#31363F'
            },
            toggle: {
                base: {
                    position: 'relative',
                    display: 'inline-block',
                    verticalAlign: 'top',
                    marginLeft: '-5px',
                    height: '24px',
                    width: '24px'
                },
                wrapper: {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    margin: '-7px 0 0 -7px',
                    height: '14px'
                },
                height: 14,
                width: 14,
                arrow: {
                    fill: '#9DA5AB',
                    strokeWidth: 0
                }
            },
            header: {
                base: {
                    display: 'inline-block',
                    verticalAlign: 'top',
                    color: '#9DA5AB'
                },
                connector: {
                    width: '2px',
                    height: '12px',
                    borderLeft: 'solid 2px black',
                    borderBottom: 'solid 2px black',
                    position: 'absolute',
                    top: '0px',
                    left: '-21px'
                },
                title: {
                    lineHeight: '24px',
                    verticalAlign: 'middle'
                }
            },
            subtree: {
                listStyle: 'none',
                paddingLeft: '19px'
            },
            loading: {
                color: '#E2C089'
            }
        }
    }
}

const style = {
    tree: {
        base: {
            listStyle: 'none'
        },
        node: {
            base: {
                
            }
        }
    }
}

export default {
    decorators,
    style
}
