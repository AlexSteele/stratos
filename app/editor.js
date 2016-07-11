'use strict';

const {EditorPane} = require('./editorPane.js');
const {createKeyListener, defaultKeyMap} = require('./keys.js');
const {CommandModal} = require('./commandModal.js');

function Editor(parentElem) {

    this.domNode = document.createElement('div');
    this.domNode.className = 'stratos-editor';
    parentElem.appendChild(this.domNode);
    
    this.activePane = new EditorPane(this.domNode);
    this.editorPanes = [this.activePane];

    this.commandModal = new CommandModal({
        parentElem: this.domNode,
        //actionHandlers: {},
        onSubmitAction: (action) => this.handleCommandModalAction(action),
        onSubmitActionError: () => this.handleCommandModalActionError()
    });
    
    this.keyListener = createKeyListener({
        elem: this.activePane.domNode,
        keyMap: defaultKeyMap,
        onKeyAction: (action) => this.handleAction(action),
        onKeyError: (err) => this.handleKeyError(err)
    });

    this.activePane.setFocused();
};

Editor.prototype.insertText = function(text) {
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

Editor.prototype.deleteForwardChar = function() {
    if (this.activePane) {
        this.activePane.deleteForwardChar();
    }
};

Editor.prototype.killLine = function() {
    if (this.activePane) {
        this.activePane.killLine();
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

Editor.prototype.moveCursorBeginningOfLine = function() {
    if (this.activePane) {
        this.activePane.moveCursorBeginningOfLine();
    }
};

Editor.prototype.moveCursorEndOfLine = function() {
    if (this.activePane) {
        this.activePane.moveCursorEndOfLine();
    }
};

Editor.prototype.moveCursorTo = function(line, col) {
    if (this.activePane) {
        this.activePane.moveCursorTo(line, col);
    }
};

Editor.prototype.toggleCommandModal = function() {
    this.commandModal.toggle();
};

Editor.prototype.handleCommandModalAction = function(action) {
    this.commandModal.toggle();
    this.commandModal.clearInput();
    this.handleAction(action);
    if (this.activePane) {
        this.activePane.setFocused();
    }
};

Editor.prototype.handleCommandModalActionError = function() {
    this.commandModal.toggle();
    if (this.activePane) {
        this.activePane.setFocused();
    }
};

Editor.prototype.handleAction = function(action) {

    // TODO: Move into global object to avoid possible redeclarations on each call.
    const actionHandlers = {
        'INSERT':                        action => this.insertText(action.text),
        'INSERT_NEW_LINE':               () => this.insertNewLine(),
        'DELETE_BACK_CHAR':              () => this.deleteBackChar(),
        'DELETE_FORWARD_CHAR':           () => this.deleteForwardChar(),
        'KILL_LINE':                     () => this.killLine(),
        'MOVE_TO_POS':                   action => this.moveCursorTo(action.line, action.col),
        'MOVE_CURSOR_LEFT':              () => this.moveCursorLeft(),
        'MOVE_CURSOR_RIGHT':             () => this.moveCursorRight(),
        'MOVE_CURSOR_UP':                () => this.moveCursorUp(),
        'MOVE_CURSOR_DOWN':              () => this.moveCursorDown(),
        'MOVE_CURSOR_BEGINNING_OF_LINE': () => this.moveCursorBeginningOfLine(),
        'MOVE_CURSOR_END_OF_LINE':       () => this.moveCursorEndOfLine(),
        'TOGGLE_COMMAND_MODAL':          () => this.toggleCommandModal()
    };
    
    const handler = actionHandlers[action.type];

    if (handler) {
        handler(action);
    } else {
        throw new Error('Editor: No handler for action ' + action);
    }
};

Editor.prototype.handleKeyError = function(keys) {
    console.log('Editor: Key error: ' + keys); 
};

module.exports.Editor = Editor;
