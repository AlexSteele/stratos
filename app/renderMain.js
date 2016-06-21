'use strict';

const electron = require('electron');
const {ipcRenderer} = electron;
const childProcess = require('child_process');

// This is top-level. 
function EditorController(orbProcess) {
    this.activeBufferController = null; 
    this.bufferControllers = [];

    document.body.addEventListener('keydown', (e) => this.onKeyDown(e));
    orbProcess.stdout.on('data', this.handleModelMessage);
    orbProcess.stderr.on('data', this.handleModelError); 
    orbProcess.on('close', this.handleOrbClose);
    orbProcess.on('error', this.handleOrbError);
}

EditorController.prototype.onKeyDown = function(e) {
    console.log('KeyDown: ' + e.key);
    const key = String.fromCodePoint(e.key); // TODO: Fix. It seems Mozilla discourages use of this. 
    this.orbProcess.stdin.write(JSON.stringify({
        type: 'KEY_DOWN',
        key: key
    }));
};

EditorController.prototype.handleModelMessage = function(d) {
    const message = JSON.parse(d);
    this.handleAction(message); 
};

EditorController.prototype.handleModelError = function(e) {
    
};

EditorController.prototype.handleOrbClose = function(code) {
    
};

EditorController.prototype.handleOrbError = function(code) {
    
};

EditorController.prototype.handleAction = function(action) {
    switch (action.type) {
    default:
        throw new Error('Not implemented.'); 
    }
};

function BufferController(view) {
    this.view = view;
    this.isActive = false; 
}

BufferController.prototype.setActive = function(on) {
    this.isActive = on; 
};

BufferController.prototype.handleAction = function(action) {
    switch (action.type) {
    case 'MOVE_CURSOR_LEFT':
    case 'MOVE_CURSOR_RIGHT':
    case 'MOVE_CURSOR_UP':
    case 'MOVE_CURSOR_DOWN':
    }
};

// This is really a BufferView if we use consistent terminology.
// It's not top level, but it's not just the editable text field either... 
function EditorView(domNode) {
    console.log('EditorView created.');
    this.domNode = domNode;
    this.gutterView = null;
    this.bufferView = null; 
}

function BufferView(domNode) {
    console.log('BufferView created.');
    this.domNode = domNode;
}

BufferView.prototype.appendLine = function(text) {
    const span = document.createElement('span');
    span.innerHTML = text;
    span.setAttribute('class', 'line');
    this.domNode.appendChild(span); 
};

BufferView.prototype.changeLine = function(num, text) {
    
};

BufferView.prototype.insertLine = function(num, text) {
    
};

BufferView.prototype.removeLine = function(num) {
    
};

function GutterView(domNode) {
    console.log('GutterView created.');
    this.domNode = domNode; 
}

GutterView.prototype.hide = function() {
    
};

GutterView.prototype.show = function() {
    
};

function TabCollectionView(domNode) {
    console.log('TabCollectionView created.');
    this.domNode = domNode; 
}

TabCollectionView.prototype.addTabView = function(view) {
    
};

TabCollectionView.prototype.removeTabView = function(name) {
    
};

function TabView(domNode) {
    console.log('TabView created.'); 
    this.domNode = domNode;
}

TabView.prototype.setName = function(name) {
    
};

function CursorView(domNode) {
    console.log('CursorView created.'); 
    this.domNode = domNode; 
}

CursorView.prototype.moveLeft = function(delta) {
    
};

CursorView.prototype.moveRight = function(delta) {
    
};

CursorView.prototype.moveDown = function(delta) {
    
};

CursorView.prototype.moveUp = function(delta) {
    
};

const orbProcess = childProcess.spawn('orb'); 

orbProcess.stdout.on('data', d => console.log('Data received from orb: ' + d));
orbProcess.stderr.on('data', d => console.log('Err received from orb: ' + d));
orbProcess.on('close', code => console.log('Orb closed with code ' + code));
orbProcess.on('error', (e) => console.log('Error: ' + e)); 

// orbProcess.kill();

// TODO: Cache 'quickKeyReferences - actions which don't need to be sent to
// model before completion. These can be queried from the model upon process start/buffer creation. 

const editorRoot = document.getElementById('editor-root');
const editor = new EditorController(orbProcess); 
