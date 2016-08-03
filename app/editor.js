'use strict';

const CommandModal = require('./commandModal.js');
const ContextBar = require('./contextBar.js');
const PaneGroupContainer = require('./paneGroupContainer.js');
const {getSharedEditorComponentSettings} = require('./utils.js');

const defaults = {
    keyMaps: {},
    sharedEditorComponentSettings: {
        charWidth: 0,
        charHeight: 0
    }
};

function Editor(parentElem, settings = defaults) {

    this.keyMaps = settings.keyMaps || defaults.keyMaps;
    this.sharedEditorComponentSettings = settings.sharedEditorComponentSettings || defaults.sharedEditorComponentSettings;

    this.domNode = document.createElement('div');
    this.domNode.className = 'stratos-editor';
    parentElem.appendChild(this.domNode);

    this.commandModal = new CommandModal(this.domNode, {
        keyMap: this.keyMaps['command-modal'],
        onKeyAction: (action) => this._handleAction(action),
        onKeyError: (error) => this._handleKeyError(error),
        onSubmitAction: (action) => this._handleCommandModalAction(action),
        onSubmitActionError: (input) => console.log('Editor: No action for ' + input)
    });

    this.contextBar = new ContextBar(this.domNode);

    this.panesContainer = new PaneGroupContainer(this.domNode, {
        height: this.getHeight(),
        width: this.getWidth(),
        onUnknownAction: (action) => this._handleAction(action),
        paneGroupSettings: {
            keyMaps: this.keyMaps,
            sharedEditorComponentSettings: this.sharedEditorComponentSettings,
            onCursorMoved: (line, col) => this._handleCursorMoved(line, col),
            onNewPane: () => this._handleNewPane(),
            onSwitchPane: (newActivePane) => this._handleSwitchPane(newActivePane),
            onClosePane: () => this._handleClosePane(),
            onActivePaneNameChanged: (newName) => this.contextBar.setTabNameView(newName)
        }
    });

    this._initComponents();
    this._initEventListeners();
};

Editor.prototype._initComponents = function() {
    this.panesContainer.setActive();
};

Editor.prototype._initEventListeners = function() {
    window.addEventListener('resize', () => this._checkResizePanes());
};

Editor.prototype.showContextBar = function() {
    if (!this.contextBar.isVisible()) {
        this.contextBar.show();
        this._checkResizePanes();    
    }    
};

Editor.prototype.hideContextBar = function() {
    if (this.contextBar.isVisible()) {
        this.contextBar.hide();
        this._checkResizePanes();    
    }    
};

Editor.prototype.toggleCommandModal = function() {
    this.commandModal.toggle();
    
    if (this.commandModal.isVisible()) {
        this.panesContainer.setInactive();
        this.contextBar.setInactive();
    } else {
        this.panesContainer.setActive();
        this.contextBar.setActive();
    }
};

Editor.prototype.getHeight = function() {
    return this.domNode.clientHeight;
};

Editor.prototype.getWidth = function() {
    return this.domNode.clientWidth;
};

Editor.prototype._handleCursorMoved = function(line, col) {
    
    // This makes the assumption that a pane's cursor only moves
    // when it is the active pane.
    this.contextBar.setCursorPositionView(line, col);
};

Editor.prototype._checkResizePanes = function() {

    const panesHeight = this.getHeight() - this.contextBar.getVisibleHeight();
    const panesWidth = this.getWidth();
    
    if (this.panesContainer.getHeight() !== panesHeight) {
        this.panesContainer.setHeight(panesHeight);
    }
    if (this.panesContainer.getWidth() !== panesWidth) {
        this.panesContainer.setWidth(panesWidth);
    }
};

Editor.prototype._handleNewPane = function(newPane) {
    const isFirstPane = (!this.panesContainer) || this.panesContainer.getPaneCount() === 1;
    if (isFirstPane) {
        this.contextBar.show();   
    }
};

Editor.prototype._handleSwitchPane = function(newActivePane) {
    if (newActivePane) {
        this.contextBar.setTabNameView(newActivePane.tabName);
        const [line, col] = newActivePane.getCursorPosition();
        this.contextBar.setCursorPositionView(line, col);
        this.contextBar.setModeNameView(newActivePane.getModeName());
    } else {
        this.contextBar.clear();
    }
};

Editor.prototype._handleClosePane = function() {
    const allPanesClosed = this.panesContainer.getPaneCount() === 0;
    if (allPanesClosed) {
        this.contextBar.hide();
    }
};

Editor.prototype._handleCommandModalAction = function(action) {
    this.commandModal.clearInput();
    this.commandModal.toggle();
    if (this.panesContainer.activeGroup) {
        this.contextBar.setActive();
        this.panesContainer.setActive();
        
        // TODO: Don't manually walk down the component tree.
        if (this.panesContainer.activeGroup.activePane) {
            this.panesContainer.activeGroup.activePane._handleAction(action);
        } else {
            this.panesContainer.activeGroup._handleAction(action);
        }
    } else {
        this._handleAction(action);
    }
};

Editor.prototype._handleAction = function(action) {

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

module.exports = Editor;

