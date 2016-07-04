'use strict';

const {EditorPane} = require('./editorPane.js');
const {createKeyListener, defaultKeyMap} = require('./keys.js'); 

function Editor(rootElem) {

    this.domNode = document.createElement('div');
    this.domNode.className = 'stratos-editor';

    this.activePane = new EditorPane(this.domNode);
    this.editorPanes = [this.activePane];
    
    this.keyListener = createKeyListener(document.body,
        defaultKeyMap,
        (action) => this.handleKeyAction(action),
        (err) => this.handleKeyError(err));

    this.activePane.setFocused();
    
    rootElem.appendChild(this.domNode);
};

Editor.prototype.insertText = function(text) {
    console.log('Editor: Inserting text.'); // TODO: remove
    if (this.activePane) {
        this.activePane.insertText(text);
    }
};

Editor.prototype.insertNewLine = function() {
    if (this.activePane) {
        this.activePane.insertNewLine();
    }
};

Editor.prototype.deleteBackChar = function() {
    if (this.activePane) {
        this.activePane.deleteBackChar(); 
    }
};

Editor.prototype.moveCursorLeft = function() {
    if (this.activePane) {
        this.activePane.moveCursorLeft();
    }
};

Editor.prototype.moveCursorRight = function() {
    if (this.activePane) {
        this.activePane.moveCursorRight();
    }
};

Editor.prototype.moveCursorUp = function() {
    if (this.activePane) {
        this.activePane.moveCursorUp();
    }
};

Editor.prototype.moveCursorDown = function() {
    if (this.activePane) {
        this.activePane.moveCursorDown();
    }
};

Editor.prototype.handleKeyAction = function(action) {

    // TODO: Move into global object to avoid possible redeclarations on each call.
    const actionHandlers = {
        'INSERT':            action => this.insertText(action.text),
        'INSERT_NEW_LINE':   action => this.insertNewLine(),
        'DELETE_BACK_CHAR':  action => this.deleteBackChar(),
        'MOVE_CURSOR_LEFT':  action => this.moveCursorLeft(),
        'MOVE_CURSOR_RIGHT': action => this.moveCursorRight(),
        'MOVE_CURSOR_UP':    action => this.moveCursorUp(),
        'MOVE_CURSOR_DOWN':  action => this.moveCursorDown()
    };
    
    const handler = actionHandlers[action.type];

    if (handler) {
        handler.call(this, action);
    } else {
        console.log('Editor: No handler for action ' + action);
    }
};

Editor.prototype.handleKeyError = function(keys) {
    console.log('Editor: Key error: ' + keys); 
};

module.exports.Editor = Editor;

