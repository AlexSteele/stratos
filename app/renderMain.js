'use strict';

const electron = require('electron');
const {ipcRenderer} = electron;
const childProcess = require('child_process');

console.log('Electron: ' + electron); 

const orbProcess = childProcess.spawn('orb'); 

console.log(orbProcess);
console.log('stdin: ' + orbProcess.stdin);
console.log('stdout: ' + orbProcess.stdout);
orbProcess.stdout.on('data', d => console.log('Data received from orb: ' + d));
orbProcess.stderr.on('data', d => console.log('Err received from orb: ' + d));
orbProcess.on('close', code => console.log('LS closed with code ' + code));
orbProcess.on('error', (e) => console.log('Error: ' + e)); 

// orbProcess.kill();

const editorRoot = document.getElementById('editor-root');
const editor = new EditorView(editorRoot);

function EditorView(domNode) {
    console.log('EditorView created.');
    this.domNode = domNode;
    this.bufferViews = [];
    
    const bufferRoot = document.createElement('div');
    bufferRoot.setAttribute('id', 'buffer-root');
    this.bufferViews.push(new BufferView(bufferRoot)); 
}

function BufferView(domNode) {
    console.log('BufferView created.');
    this.domNode = domNode;
    
    document.body.addEventListener('keydown', (e) => {
        console.log('BufferView: key pressed');
        console.log(e.keyCode);
        ipcRenderer.send('asynchronous-message',
                         {type: 'BUFFER_VIEW_KEY_PRESS',
                          key: e.keyCode});
        ipcRenderer.on('asynchronous-message', (event, arg) => {
            console.log('Event: ' + event);
            console.log('Arg: ' + arg);
            console.log('Key: ' + arg.key);
        });
        
    });
}

