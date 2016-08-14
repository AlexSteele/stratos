'use strict';

const ClipBoard = require('./clipBoard.js');
const CommandModal = require('./commandModal.js');
const ContextBar = require('./contextBar.js');
const PaneContainer = require('./paneContainer.js');
const {getSharedEditorComponentSettings} = require('./utils.js');

const defaults = {
    keyMaps: {},
    sharedEditorComponentSettings: {
        charWidth: 0,
        charHeight: 0
    }
};

function StratosEditor(parentElem, settings = defaults) {

    this.keyMaps = settings.keyMaps || defaults.keyMaps;
    this.clipBoard = new ClipBoard();
    this.sharedEditorComponentSettings = settings.sharedEditorComponentSettings || defaults.sharedEditorComponentSettings;

    this.domNode = document.createElement('div');
    this.domNode.className = 'stratos-editor';
    parentElem.appendChild(this.domNode);

    this.commandModal = new CommandModal(this.domNode, {
        keyMap: this.keyMaps['command-modal'],
        onKeyAction: (action) => this._handleAction(action),
        onKeyError: (error) => this._handleKeyError(error),
        onSubmitAction: (action) => this._handleCommandModalAction(action),
        onSubmitActionError: (input) => console.log('StratosEditor: No action for ' + input)
    });

    this.contextBar = new ContextBar(this.domNode);

        this.paneContainer = new PaneContainer(this.domNode, {
        height: this.getHeight(),
        width: this.getWidth(),
        onUnknownAction: (action) => this._handleAction(action),
        paneSettings: {
            keyMaps: this.keyMaps,
            sharedEditorComponentSettings: this.sharedEditorComponentSettings,
            onCursorMoved: (line, col) => this._handleCursorMoved(line, col),
            onNewEditor: () => this._handleNewEditor(),
            onSwitchEditor: (newActiveEditor) => this._handleSwitchEditor(newActiveEditor),
            onCloseEditor: () => this._handleCloseEditor(),
            onActiveEditorNameChanged: (newName) => this.contextBar.setTabNameView(newName),
            bufferSettings: {
                clipBoard: this.clipBoard,
                onUnsavedChanges: () => this.contextBar.setUnsavedChangesView(true),
                onNoUnsavedChanges: () => this.contextBar.setUnsavedChangesView(false)
            }
        }
    });

    window.addEventListener('resize', () => this._checkResizePanes());
    this.paneContainer.setActive();
};

StratosEditor.prototype.showContextBar = function() {
    if (!this.contextBar.isVisible()) {
        this.contextBar.show();
        this._checkResizePanes();    
    }    
};

StratosEditor.prototype.hideContextBar = function() {
    if (this.contextBar.isVisible()) {
        this.contextBar.hide();
        this._checkResizePanes();    
    }    
};

StratosEditor.prototype.toggleCommandModal = function() {
    this.commandModal.toggle();
    
    if (this.commandModal.isVisible()) {
        this.paneContainer.setInactive();
        this.contextBar.setInactive();
    } else {
        this.paneContainer.setActive();
        this.contextBar.setActive();
    }
};

StratosEditor.prototype.getHeight = function() {
    return this.domNode.clientHeight;
};

StratosEditor.prototype.getWidth = function() {
    return this.domNode.clientWidth;
};

StratosEditor.prototype._handleCursorMoved = function(line, col) {
    
    // This makes the assumption that a pane's cursor only moves
    // when it is the active pane.
    this.contextBar.setCursorPositionView(line + 1, col + 1);
};

StratosEditor.prototype._checkResizePanes = function() {

    const panesHeight = this.getHeight() - this.contextBar.getVisibleHeight();
    const panesWidth = this.getWidth();
    
    if (this.paneContainer.getHeight() !== panesHeight) {
        this.paneContainer.setHeight(panesHeight);
    }
    if (this.paneContainer.getWidth() !== panesWidth) {
        this.paneContainer.setWidth(panesWidth);
    }
};

StratosEditor.prototype._handleNewEditor = function(newPane) {
    const isFirstEditor = (!this.paneContainer) || this.paneContainer.getEditorCount() === 1;
    if (isFirstEditor) {
        this.contextBar.show();   
    }
};

StratosEditor.prototype._handleSwitchEditor = function(newActiveEditor) {
    if (newActiveEditor) {
        this.contextBar.setTabNameView(newActiveEditor.tabName);
        const [line, col] = newActiveEditor.getCursorPosition();
        this.contextBar.setCursorPositionView(line, col);
        this.contextBar.setModeNameView(newActiveEditor.getModeName());
        this.contextBar.setUnsavedChangesView(newActiveEditor.hasUnsavedChanges());
    } else {
        this.contextBar.clear();
    }
};

StratosEditor.prototype._handleCloseEditor = function() {
    const allEditorsClosed = this.paneContainer.getEditorCount() === 0;
    if (allEditorsClosed) {
        this.contextBar.hide();
    }
};

StratosEditor.prototype._handleCommandModalAction = function(action) {
    this.commandModal.clearInput();
    this.commandModal.toggle();
    if (this.paneContainer.activePane) {
        this.contextBar.setActive();
        this.paneContainer.setActive();
        
        // TODO: Don't manually walk down the component tree.
        if (this.paneContainer.activePane.activeEditor) {
            this.paneContainer.activePane.activeEditor._handleAction(action);
        } else {
            this.paneContainer.activePane._handleAction(action);
        }
    } else {
        this._handleAction(action);
    }
};

StratosEditor.prototype._handleAction = function(action) {

    const actionHandlers = {
        'TOGGLE_COMMAND_MODAL':  () => this.toggleCommandModal(),
        'SHOW_CONTEXT':          () => this.showContextBar(),
        'HIDE_CONTEXT':          () => this.hideContextBar()
    };
    
    const handler = actionHandlers[action.type];

    if (handler) {
        handler(action);
    } else {
        console.log('No handler for action:');
        console.log(action);
    }
};

module.exports = StratosEditor;
