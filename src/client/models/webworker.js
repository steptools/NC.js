/* G. Hemingway Copyright @2015
 * Asynchronous loading and parsing of CAD model information
 *
 * Extended by Gabor Pap to include TySON decoding
 */

"use strict";
function processPreviewJSON(url, workerID, data) {
    // pass back to main thread
    self.postMessage({
        type: 'previewLoad',
        url: url,
        data: data,
        workerID: workerID,
    });
}

function processNCState(url, workerID, data) {
    // All we really need to do is pass this back to the main thread
    self.postMessage({
        type: "rootLoad",
        url: url,
        data: data,
        workerID: workerID
    });
}

function processAnnotation(url, workerID, data) {
    let parts = url.split("/");
    // All we really need to do is pass this back to the main thread
    self.postMessage({
        type: "annotationLoad",
        url: url,
        file: parts[parts.length - 2],
        data: data,
        workerID: workerID
    });
    self.postMessage({
        type: "workerFinish",
        workerID: workerID,
        file: parts[parts.length - 2]
    });
}

/*********************************************************************/

function unindexValues(data, buffers) {
    let numValues = data.points.length;
    let factor = Math.pow(10, data.precision);
    for (let i = 0; i < numValues; i++) {
        buffers.position[i] = data.points[i]/factor;
        buffers.normals[i] = data.normals[i]/factor;
    }
}

function faceLoad(data, buffers) {
    let index = 0;
    let index2 = 0;
    for(let i = 0; i < data.faces.length ; i++){
        let face = {
            start: 0,
            end: 0
        }
        let pIndex = data.faces[i].count * 3
        face.start = index2;
        face.end = index2 + pIndex;
        buffers.faces[data.faces[i].id] = face;
        index2 = index2 + pIndex;
    }
    for (let i = 0; i < data.faces.length; i++) {
        for(let j = 0; j < (data.faces[i]).count; j++){
            if(data.faces[i].color != null){
                buffers.color[index++] = data.faces[i].color[0];
                buffers.color[index++] = data.faces[i].color[1];
                buffers.color[index++] = data.faces[i].color[2];
            }
            else{
                buffers.color[index++] = -1;
                buffers.color[index++] = -1;
                buffers.color[index++] = -1;
            }
        }
    }
}

//This is the data that is getting passed to the data_loader.js line 201
function processShellJSON(url, workerID, dataJSON, signalFinish) {
    // Just copy the data into arrays
    let buffers = {
        position: new Float32Array(dataJSON.points.length),
        normals: new Float32Array(dataJSON.points.length),
        color: new Float32Array(dataJSON.points.length),
        faces: new Object()
    };

    unindexValues(dataJSON,buffers);
    if (dataJSON.faces)
        faceLoad(dataJSON, buffers);
    let parts = url.split("/");
    self.postMessage({
        type: "shellLoad",
        data: buffers,
        id: dataJSON.id,
        workerID: workerID
    });
    // Do we signal that we are all done
    if (signalFinish) {
        let file = parts[parts.length - 2];
        
        self.postMessage({
            type: "workerFinish",
            workerID: workerID,
            file: file
        });
    }
}

function processBatchJSON(url, workerID, data) {
    let dataJSON = JSON.parse(data);
    let parts = url.split("/");
    self.postMessage({
        type: "parseComplete",
        file: parts[parts.length - 1]
    });
    for (let i = 0; i < dataJSON.shells.length; i++) {
        processShellJSON(url, workerID, dataJSON.shells[i], false);
    }
    self.postMessage({
        type: "workerFinish",
        workerID: workerID,
        file: parts[parts.length - 1]
    });
}
/*********************************************************************/


let messageHandler = function(e) {
    // Get the request URL info
    let url = e.data.url;
    let workerID = e.data.workerID;
    
    // Determine data type
    let parts = url.split('.');
    let dataType = e.data.dataType;
    parts = url.split("/");
    
    // define a callback for the "load" event
    // using arrow function to bind 'this' to the higher-level 'self'
    let loadCb = (res) => {
        //TODO: MAKE THIS LESS HARDCODED
        let file = parts.slice(-2, -1).join('/');
        if (file === 'state') {
            file = parts.slice(-2).join('/');
        }
        // What did we get back
        switch(e.data.type) {
            case "annotation":
                processAnnotation(url, workerID, res.text);
                break;
            case "previewShell":
                file = parts.slice(-1).join('/');
                if (file === 'tool') {
                    file = parts.slice(-2).join('/');
                }
                file = 'preview-' + file;
                processPreviewJSON(url, workerID, res.text);
                break;
            case "shell":
                // Try to parse the JSON file
                let dataJSON;
                try {
                     dataJSON = JSON.parse(res.text);
                } catch(ex) {
                    console.log(ex);
                    console.log(res.text);
                    dataJSON = {
                        precision:      2,
                        pointsIndex:    [],
                        normalsIndex:   [],
                        colorsData:     [],
                        values:         []
                    };
                }

                file = dataJSON.id;
                self.postMessage({
                    type: "parseComplete",
                    file: parts[parts.length - 2]
                });
                // Process the Shell data
                processShellJSON(url, workerID, dataJSON, true);
                break;
            case "nc":
                processNCState(url, workerID, res.text);
                break;
                break;
            default:
                throw Error("DataLoader.webworker - Invalid request type: " + e.data.type);
                break;
        }

        self.postMessage({type : "loadComplete", file: file });
    }
    
    // define a callback for the "progress" event
    // we use arrow functions here to properly bind 'this'
    let progressCb = (event) => {
        let file = parts[parts.length - 2] + '/' + parts[parts.length - 1];
        let message = { type: "loadProgress", file: file };
        if (event.lengthComputable) {
            message.loaded = event.loaded / event.total * 100.0;
        }
        self.postMessage(message);
    }

    // initialize the GET request
    // This makes all the shell requests and the res is sent to handle
    // handle then sends it to the loadCb for processing
    let req = request.get(url);

    // now define a handler callback for the response on the request
    // we use arrow functions here to properly bind 'this'
    let handle = (err, res) => {
        // we need to use the response's underlying xhr because events are dispatched to it
        // again using an arrow function to bind 'this' since loadCb needs access to the response
        // any load event that comes in is sent to the loadCb 
        res.xhr.addEventListener("load", () => {loadCb(res);});
        res.xhr.addEventListener("progress", progressCb);
        
        // check for errors and post message accordingly
        if (res.status === 404 || res.status === 403) {
            self.postMessage({
                type: "loadError",
                status: res.status,
                url: url,
                file: parts[parts.length - 2],
                workerID: workerID
            });
        }
        // this catches any other errors that may occur
        else if (err) {
            console.log ("DataLoader.webworker - Error " + err.status + " loading file: " + url);
        }
    }
    
    // actually send the request
    req.end(handle);
    
};

messageHandler = messageHandler.bind(self);
  
self.addEventListener("message", messageHandler, false);

