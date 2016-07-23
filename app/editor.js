'use strict';

const {CommandModal} = require('./commandModal.js');
const {ContextBar} = require('./contextBar.js');
const {EditorPane} = require('./editorPane.js');
const {KeyListener} = require('./keyListener.js');
const {numDigitsIn, getSharedEditorComponentSettings} = require('./utils.js');
const {TabBar} = require('./tabBar.js');

function Editor(parentElem, keyMaps) {

    this.keyMaps = keyMaps;
    this.panes = [];
    this.activePane = null;
    this.prevActivePane = null;

    this.domNode = document.createElement('div');
    this.domNode.className = 'stratos-editor';
    parentElem.appendChild(this.domNode);
    
    this.tabBar = new TabBar(this.domNode, {
        onTabClick: (name) => this.switchTab(name)
    });

    this.commandModal = new CommandModal(this.domNode, {
        keyMap: this.keyMaps['command-modal-default'],
        onKeyAction: (action) => this._handleAction(action),
        onKeyError: (error) => this._handleKeyError(error),
        onSubmitAction: (action) => this._handleCommandModalAction(action),
        onSubmitActionError: (input) => this._handleCommandModalActionError(input)
    });

    this.contextBar = new ContextBar(this.domNode);

    // Only active when no panes are open. This is to allow, for instance,
    // an 'open tab' keybinding even when no EditorPanes are active.
    this.noPanesKeyListener = new KeyListener(document.body, {
        keyMap: this.keyMaps['no-panes-default'],
        allowDefaultOnKeyError: true,
        onKeyAction: (action) => this._handleAction(action),
        onKeyError: (error) => console.log('Editor: Key error: ' + error)
    });

    // These are used when instantiating editorPane instances.
    this.sharedEditorComponentSettings = getSharedEditorComponentSettings(document.body);

    this._initComponents();
    this._initEventListeners();
};

Editor.prototype._initComponents = function() {
    this.contextBar.hide();
};

Editor.prototype._initEventListeners = function() {
    window.addEventListener('resize', (e) => {
        this._checkResizePanes();
    });
};

Editor.prototype.newTab = function(name = 'untitled') {
    const tabName = this._getUniqueTabName(name);
    const tabsHeight = this.tabBar.getVisibleHeight();
    const paneHeight = this.getVisibleHeight() - tabsHeight - this.contextBar.getVisibleHeight();
    const pane = new EditorPane(this.domNode, {
        name: name,
        tabName: tabName,
        keyMap: this.keyMaps['editor-default'],
        height: paneHeight,
        width: this.getVisibleWidth(),
        topOffset: tabsHeight,
        sharedEditorComponentSettings: this.sharedEditorComponentSettings,
        onUnknownAction: (action) => this._handleAction(action),
        onCursorMoved: (line, col) => this._handleCursorMoved(line, col)
    });
    
    this.panes.push(pane);
    this.tabBar.add(tabName);
    this.switchTab(tabName);

    if (this.panes.length === 1) {
        this.showContextBar();
        this.noPanesKeyListener.unattach();
    }
};

// If _tabName is undefined, switches to the previously opened tab.
Editor.prototype.switchTab = function(tabName) {
    if (this.activePane && tabName === this.activePane.tabName) return;
    
    const toSwitchTo = tabName ?
              this.panes.find(e => e.tabName === tabName) :
              this.prevActivePane;

    if (!toSwitchTo) return;
    
    if (this.activePane) {
        this.activePane.hide();
    }

    this.prevActivePane = this.activePane;
    this.activePane = toSwitchTo;
    this.activePane.show();
    this.activePane.setActive();

    this.tabBar.setSelected(this.activePane.tabName);
    this.contextBar.setTabNameView(this.activePane.tabName);
    const [line, col] = this.activePane.getCursorPosition();
    this.contextBar.setCursorPositionView(line, col);
};

// If tabName is undefined, closes the active tab.
Editor.prototype.closeTab = function(_tabName) {
    if (!_tabName && !this.activePane) return;

    const tabName = _tabName || this.activePane.tabName;
    const paneIndex = this.panes.findIndex(e => e.tabName === tabName);
    const pane = this.panes.splice(paneIndex, 1)[0];

    this.tabBar.remove(pane.tabName);
    this.domNode.removeChild(pane.domNode);
    
    if (pane === this.activePane) {
        this.activePane = null;
        this.switchTab();
    } else if (pane === this.prevActivePane) {
        this.prevActivePane = null;
    }

    // We lose the prevActivePane when either the activePane or prevActivePane is closed.
    if (!this.prevActivePane) {
        this.prevActivePane = this.panes.find(e => e !== this.activePane) || null;
    }

    if (this.panes.length === 0) {
        this.contextBar.hide();
        this.noPanesKeyListener.attach();
    }
};

Editor.prototype.closeAllTabs = function() {
    this.panes.forEach(e => {
        this.tabBar.remove(e.tabName);
        this.domNode.removeChild(e.domNode);
    });
    this.panes = [];
    this.activePane = null;
    this.prevActivePane = null;
    this.contextBar.hide();
    this.noPanesKeyListener.attach();
};

Editor.prototype.showTabBar = function() {
    if (!this.tabBar.isVisible()) {
        this.tabBar.show();
        this.panes.forEach(e => e.setTopOffset(this.tabBar.getVisibleHeight()));
        this._checkResizePanes();
    }
};

Editor.prototype.hideTabBar = function() {
    if (this.tabBar.isVisible()) {
        this.tabBar.hide();
        this.panes.forEach(e => e.setTopOffset(0));
        this._checkResizePanes();
    }
};

Editor.prototype.showGutter = function() {
    if (this.activePane) {
        this.activePane.showGutter();    
    }    
};

Editor.prototype.hideGutter = function() {
    if (this.activePane) {
        this.activePane.hideGutter();        
    }
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
    
    if (this.panes.length === 0) return;
    
    if (this.commandModal.isToggled()) {
        this.activePane.setInactive();
        this.tabBar.setInactive();
        this.contextBar.setInactive();
    } else {
        this.activePane.setActive();
        this.tabBar.setActive();
        this.contextBar.setActive();
    }
};

Editor.prototype.getVisibleHeight = function() {
    return this.domNode.clientHeight;
};

Editor.prototype.getVisibleWidth = function() {
    return this.domNode.clientWidth;
};

Editor.prototype._handleCommandModalAction = function(action) {
    this.commandModal.clearInput();
    this.commandModal.toggle();
    if (this.activePane) {

        // If the active pane has no handler, the action will propogate up
        // to this._handleAction. 
        this.activePane._handleAction(action);
        this.activePane.setActive();
        this.tabBar.setActive();
        this.contextBar.setActive();
    } else {
        this._handleAction(action);
    }
};

Editor.prototype._handleCommandModalActionError = function(action) {
    console.log('TextEditor: No command: ' + action);
};

Editor.prototype._handleAction = function(action) {

    const actionHandlers = {
        'TOGGLE_COMMAND_MODAL':          () => this.toggleCommandModal(),
        'NEW_TAB':                       action => this.newTab(action.name),
        'SWITCH_TAB':                    action => this.switchTab(action.name),
        'CLOSE_TAB':                     action => this.closeTab(action.name),
        'CLOSE_ALL':                     () => this.closeAllTabs(),
        'SHOW_TABS':                     () => this.showTabBar(),
        'HIDE_TABS':                     () => this.hideTabBar(),
        'SHOW_CONTEXT':                  () => this.showContextBar(),
        'HIDE_CONTEXT':                  () => this.hideContextBar()
    };
    
    const handler = actionHandlers[action.type];

    if (handler) {
        handler(action);
    } else {
        console.log(action);
        throw new Error('Editor: No handler for action ' + action);
        
    }
};

Editor.prototype._handleCursorMoved = function(line, col) {
    // TODO: This makes the assumption that a pane's cursor only moves
    // when it is the active pane.
    if (this.activePane) {
        this.contextBar.setCursorPositionView(line, col);
    }
};

// Assumes that all panes have the same dimensions.
Editor.prototype._checkResizePanes = function() {
    if (!this.activePane) return;
    
    const panesVisibleHeight = this.getVisibleHeight() - this.tabBar.getVisibleHeight() - this.contextBar.getVisibleHeight();
    const panesVisibleWidth = this.getVisibleWidth();
    
    if (this.activePane.getHeight() !== panesVisibleHeight) {
        this.panes.forEach(e => e.setHeight(panesVisibleHeight));
    }
    if (this.activePane.getWidth() !== panesVisibleWidth) {
        this.panes.forEach(e => e.setWidth(panesVisibleWidth));
    }
};

// If an editor pane exists with the same name as that given, returns a unique
// version of the name of the form `name-{Unique Number}`. Otherwise, returns the given name.
Editor.prototype._getUniqueTabName = function(name) {    
    const suffixNum = this.panes.reduce((prev, curr) => {
        if (prev === 0 && curr.tabName === name) {
            return prev + 1;
        }
        if (prev > 0) {
            // untitled-1 -> untitled
            const sansSuffix = curr.tabName.slice(0, curr.tabName.length - numDigitsIn(prev) - 1);
            if (sansSuffix === name) {
                return prev + 1;   
            }
        }

        return prev;
    }, 0);

    return suffixNum === 0 ? name : name + '-' + suffixNum;
};

module.exports.Editor = Editor;
