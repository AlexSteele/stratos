'use strict';

const CommandModal = require('./commandModal.js');
const ContextBar = require('./contextBar.js');
const PaneGroup = require('./paneGroup.js');
const {getSharedEditorComponentSettings} = require('./utils.js');

function Editor(parentElem, keyMaps) {

    this.keyMaps = keyMaps;
    this.paneGroups = [];
    this.activePaneGroup = null;

    this.domNode = document.createElement('div');
    this.domNode.className = 'stratos-editor';
    parentElem.appendChild(this.domNode);
    
    this.commandModal = new CommandModal(this.domNode, {
        keyMap: this.keyMaps['command-modal-default'],
        onKeyAction: (action) => this._handleAction(action),
        onKeyError: (error) => this._handleKeyError(error),
        onSubmitAction: (action) => this._handleCommandModalAction(action),
        onSubmitActionError: (input) => console.log('Editor: No action for ' + input)
    });

    this.contextBar = new ContextBar(this.domNode);

    // These are used when instantiating editorPane instances.
    this.sharedEditorComponentSettings = getSharedEditorComponentSettings(document.body);

    this._initComponents();
    this._initEventListeners();
};

Editor.prototype._initComponents = function() {
    this.contextBar.hide();
    this.activePaneGroup = new PaneGroup(this.domNode, {
        keyMaps: this.keyMaps,
        height: this.getHeight(),
        width: this.getWidth(),
        sharedEditorComponentSettings: this.sharedEditorComponentSettings,
        onUnknownAction: (action) => this._handleAction(action),
        onCursorMoved: (line, col) => this._handleCursorMoved(line, col),
        onNewPane: () => {
            const isFirstPane = this.getPaneCount() === 1;
            if (isFirstPane) {
                this.contextBar.show();   
            }
        },
        onSwitchPane: (newActivePane) => {
            this.contextBar.setTabNameView(newActivePane.tabName);
            const [line, col] = newActivePane.getCursorPosition();
            this.contextBar.setCursorPositionView(line, col);
        },
        onClosePane: () => {
            const allPanesClosed = this.getPaneCount() === 0;
            if (allPanesClosed) {
                this.contextBar.hide();
            }
        }
    });
    this.paneGroups.push(this.activePaneGroup);
    this.activePaneGroup.setActive();
};

Editor.prototype._initEventListeners = function() {
    window.addEventListener('resize', (e) => {
        this._checkResizePanes();
    });
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
    
    if (this.paneGroups.length === 0) return;
    
    if (this.commandModal.isToggled()) {
        this.activePaneGroup.setInactive();
        this.contextBar.setInactive();
    } else {
        this.activePaneGroup.setActive();
        this.contextBar.setActive();
    }
};

Editor.prototype.getHeight = function() {
    return this.domNode.clientHeight;
};

Editor.prototype.getWidth = function() {
    return this.domNode.clientWidth;
};

Editor.prototype.getPaneCount = function() {
    return this.paneGroups.reduce((p, c) => p + c.getPaneCount(), 0);
};

Editor.prototype._handleCommandModalAction = function(action) {
    this.commandModal.clearInput();
    this.commandModal.toggle();
    if (this.activePaneGroup) {
        this.contextBar.setActive();
        this.activePaneGroup.setActive();
        
        // TODO: Don't manually walk down the component tree.
        if (this.activePaneGroup.activePane) {
            this.activePaneGroup.activePane._handleAction(action);
        } else {
            this.activePaneGroup._handleAction(action);
        }
    } else {
        this._handleAction(action);
    }
};

Editor.prototype._handleAction = function(action) {

    const actionHandlers = {
        'TOGGLE_COMMAND_MODAL': () => this.toggleCommandModal(),
        'SHOW_CONTEXT':         () => this.showContextBar(),
        'HIDE_CONTEXT':         () => this.hideContextBar()
    };
    
    const handler = actionHandlers[action.type];

    if (handler) {
        handler(action);
    } else {
        console.log('No handler for action:');
        console.log(action);
    }
};

Editor.prototype._handleCursorMoved = function(line, col) {
    
    // TODO: This makes the assumption that a pane's cursor only moves
    // when it is the active pane.
    this.contextBar.setCursorPositionView(line, col);
};

// Assumes that all pane groups have the same dimensions.
// TODO: Fix this.
Editor.prototype._checkResizePanes = function() {
    if (!this.activePaneGroup) return;
    
    const panesVisibleHeight = this.getHeight() - this.contextBar.getVisibleHeight();
    const panesVisibleWidth = this.getWidth();
    
    if (this.activePaneGroup.getHeight() !== panesVisibleHeight) {
        this.paneGroups.forEach(e => e.setHeight(panesVisibleHeight));
    }
    if (this.activePaneGroup.getWidth() !== panesVisibleWidth) {
        this.paneGroups.forEach(e => e.setWidth(panesVisibleWidth));
    }
};

module.exports = Editor;
