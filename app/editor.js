'use strict';

const {CommandModal} = require('./commandModal.js');
const {ContextBar} = require('./contextBar.js');
const {EditorPane} = require('./editorPane.js');
const {KeyListener} = require('./keyListener.js');
const {TabListView} = require('./tabListView.js');
const {numDigitsIn} = require('./utils.js');

function Editor(parentElem, keyMaps) {

    this.keyMaps = keyMaps;
    this.editorPanes = [];
    this.activePane = null;
    this.prevActivePane = null;

    this.domNode = document.createElement('div');
    this.domNode.className = 'stratos-editor';
    parentElem.appendChild(this.domNode);
    
    this.tabListView = new TabListView(this.domNode, {
        onTabClick: (name) => this.switchTab(name)
    });

    this.commandModal = new CommandModal(this.domNode, {
        keyMap: this.keyMaps['command-modal-default'],
        onKeyAction: (action) => this.handleAction(action),
        onKeyError: (error) => this.handleKeyError(error),
        onSubmitAction: (action) => this.handleCommandModalAction(action),
        onSubmitActionError: () => this.handleCommandModalActionError()
    });

    this.contextBar = new ContextBar(this.domNode);

    // Only active when no panes are open. This is to allow, for instance,
    // an 'open tab' keybinding even when no EditorPanes are active.
    this.noPanesKeyListener = new KeyListener(document.body, {
        keyMap: this.keyMaps['no-panes-default'],
        allowDefaultOnKeyError: true,
        onKeyAction: (action) => this.handleAction(action),
        onKeyError: (error) => this.handleKeyError(error)
    });

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

Editor.prototype.insertText = function(text) {
    if (this.activePane) {
        this.activePane.insertText(text);
        const [line, col] = this.activePane.getCursorPosition();
        this.contextBar.setCursorPositionView(line, col);
    }
};

Editor.prototype.insertNewLine = function() {
    if (this.activePane) {
        this.activePane.insertNewLine();
        const [line, col] = this.activePane.getCursorPosition();
        this.contextBar.setCursorPositionView(line, col);
    }
};

Editor.prototype.deleteBackChar = function() {
    if (this.activePane) {
        this.activePane.deleteBackChar();
        const [line, col] = this.activePane.getCursorPosition();
        this.contextBar.setCursorPositionView(line, col);
    }
};

Editor.prototype.deleteForwardChar = function() {
    if (this.activePane) {
        this.activePane.deleteForwardChar();
        const [line, col] = this.activePane.getCursorPosition();
        this.contextBar.setCursorPositionView(line, col);
    }
};

Editor.prototype.killLine = function() {
    if (this.activePane) {
        this.activePane.killLine();
        const [line, col] = this.activePane.getCursorPosition();
        this.contextBar.setCursorPositionView(line, col);
    }
};

Editor.prototype.moveCursorLeft = function() {
    if (this.activePane) {
        this.activePane.moveCursorLeft();
        const [line, col] = this.activePane.getCursorPosition();
        this.contextBar.setCursorPositionView(line, col);
    }
};

Editor.prototype.moveCursorRight = function() {
    if (this.activePane) {
        this.activePane.moveCursorRight();
        const [line, col] = this.activePane.getCursorPosition();
        this.contextBar.setCursorPositionView(line, col);
    }
};

Editor.prototype.moveCursorUp = function() {
    if (this.activePane) {
        this.activePane.moveCursorUp();
        const [line, col] = this.activePane.getCursorPosition();
        this.contextBar.setCursorPositionView(line, col);
    }
};

Editor.prototype.moveCursorDown = function() {
    if (this.activePane) {
        this.activePane.moveCursorDown();
        const [line, col] = this.activePane.getCursorPosition();
        this.contextBar.setCursorPositionView(line, col);
    }
};

Editor.prototype.moveCursorBeginningOfLine = function() {
    if (this.activePane) {
        this.activePane.moveCursorBeginningOfLine();
        const [line, col] = this.activePane.getCursorPosition();
        this.contextBar.setCursorPositionView(line, col);
    }
};

Editor.prototype.moveCursorEndOfLine = function() {
    if (this.activePane) {
        this.activePane.moveCursorEndOfLine();
        const [line, col] = this.activePane.getCursorPosition();
        this.contextBar.setCursorPositionView(line, col);
    }
};

Editor.prototype.moveCursorTo = function(line, col) {
    if (this.activePane) {
        this.activePane.moveCursorTo(line, col);
        const [cursorLine, cursorCol] = this.activePane.getCursorPosition();
        this.contextBar.setCursorPositionView(line, col);
    }
};

Editor.prototype.newTab = function(name = 'untitled') {
    const tabName = this._getUniqueTabName(name);
    const tabsHeight = this.tabListView.getHeight();
    const paneHeight = this.getHeight() - tabsHeight - this.contextBar.getVisibleHeight();
    const pane = new EditorPane(this.domNode, {
        name: name,
        tabName: tabName,
        keyMap: this.keyMaps['editor-default'],
        onKeyAction: (action) => this.handleAction(action),
        onKeyError: (error) => this.handleKeyError(error),
        height: paneHeight,
        topOffset: tabsHeight
    });
    
    this.editorPanes.push(pane);
    this.tabListView.add(tabName);
    this.switchTab(tabName);

    if (this.editorPanes.length === 1) {
        this.showContextBar();
        this.noPanesKeyListener.unattach();
    }
};

// If _tabName is undefined, switches to the previously opened tab.
Editor.prototype.switchTab = function(tabName = undefined) {
    if (this.activePane && tabName === this.activePane.tabName) return;
    
    const toSwitchTo = tabName ?
              this.editorPanes.find(e => e.tabName === tabName) :
              this.prevActivePane;

    if (!toSwitchTo) return;
    
    if (this.activePane) {
        this.activePane.hide();
    }

    this.prevActivePane = this.activePane;
    this.activePane = toSwitchTo;
    this.activePane.show();
    this.activePane.setActive();

    this.tabListView.setSelected(this.activePane.tabName);
    this.contextBar.setTabNameView(this.activePane.tabName);
    const [line, col] = this.activePane.getCursorPosition();
    this.contextBar.setCursorPositionView(line, col);
};

// If tabName is undefined, closes the active tab.
Editor.prototype.closeTab = function(_tabName = undefined) {
    if (!_tabName && !this.activePane) return;

    const tabName = _tabName || this.activePane.tabName;
    const paneIndex = this.editorPanes.findIndex(e => e.tabName === tabName);
    const pane = this.editorPanes.splice(paneIndex, 1)[0];

    this.tabListView.remove(pane.tabName);
    this.domNode.removeChild(pane.domNode);
    
    if (pane === this.activePane) {
        this.activePane = null;
        this.switchTab();
    }

    // We lose the prevActivePane when either the activePane or prevActivePane is closed.
    if (!this.prevActivePane) {
        this.prevActivePane = this.editorPanes.find(e => e !== this.activePane) || null;
    }

    if (this.editorPanes.length === 0) {
        this.contextBar.hide();
        this.noPanesKeyListener.attach();
    }
};

Editor.prototype.showContextBar = function() {
    this.contextBar.show();
    this._checkResizePanes();
};

Editor.prototype.hideContextBar = function() {
    this.contextBar.hide();
    this._checkResizePanes();
};

Editor.prototype.toggleCommandModal = function() {
    this.commandModal.toggle();
    if (this.commandModal.isToggled()) {
        this.activePane.setInactive();
        this.tabListView.setInactive();
        this.contextBar.setInactive();
    } else {
        this.activePane.setActive();
        this.tabListView.setActive();
        this.contextBar.setActive();
    }
};

Editor.prototype.handleCommandModalAction = function(action) {
    this.commandModal.clearInput();
    this.commandModal.toggle();
    this.handleAction(action);
    if (this.activePane) {
        this.activePane.setActive();
        this.tabListView.setActive();
        this.contextBar.setActive();
    }
};

Editor.prototype.handleCommandModalActionError = function(action) {
    console.log('TextEditor: No command: ' + action);
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
        'TOGGLE_COMMAND_MODAL':          () => this.toggleCommandModal(),
        'NEW_TAB':                       action => this.newTab(action.name),
        'SWITCH_TAB':                    action => this.switchTab(action.name),
        'CLOSE_TAB':                     action => this.closeTab(action.name),
        'SHOW_CONTEXT':                  () => this.contextBar.show(),
        'HIDE_CONTEXT':                  () => this.contextBar.hide()
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

Editor.prototype.getHeight = function() {
    const height = parseInt(this.domNode.style.height) || this.domNode.scrollHeight;
    if (!height) {
        throw new Error('Editor: Unable to parse height.');
    }
    return height;
};

Editor.prototype._checkResizePanes = function() {
    const editorVisibleHeight = this.domNode.parentElement.clientHeight;
    const panesVisibleHeight = editorVisibleHeight - this.tabListView.getHeight() - this.contextBar.getVisibleHeight();
    this.editorPanes.forEach(e => {
        e.setHeight(panesVisibleHeight);
        e.setVisibleHeight(panesVisibleHeight);
    });
    
    const panesVisibleWidth = this.domNode.parentElement.clientWidth;
    this.editorPanes.forEach(e => e.setVisibleWidth(panesVisibleWidth));
};

// If an editor pane exists with the same name as that given, returns a unique
// version of the name. Otherwise, returns the given name.
Editor.prototype._getUniqueTabName = function(name) {    
    const suffixNum = this.editorPanes.reduce((prev, curr) => {
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
