'use strict';

const {EditorPane} = require('./editorPane.js');
const {CommandModal} = require('./commandModal.js');
const {TabListView} = require('./tabListView.js');
const {numDigitsIn} = require('./utils.js');

function Editor(parentElem, keyMaps) {

    this.keyMaps = keyMaps;
    this.editorPanes = [];
    this.activePane = null;

    this.domNode = document.createElement('div');
    this.domNode.className = 'stratos-editor';
    parentElem.appendChild(this.domNode);
    
    this.tabListView = new TabListView(this.domNode, {
        onTabClick: (name) => this.handleTabClick(name)
    });

    this.commandModal = new CommandModal(this.domNode, {
        //actionHandlers: {},
        keyMap: this.keyMaps['command-modal-default'],
        onKeyAction: (action) => this.handleAction(action),
        onKeyError: (error) => this.handleKeyError(error),
        onSubmitAction: (action) => this.handleCommandModalAction(action),
        onSubmitActionError: () => this.handleCommandModalActionError()
    });

    this._initEventListeners();
};

Editor.prototype._initEventListeners = function() {
    window.addEventListener('resize', (e) => {
        const visibleHeight = document.body.clientHeight;
        const panesVisibleHeight = visibleHeight - this.tabListView.getHeight();
        this.editorPanes.forEach(e => {
            e.setHeight(panesVisibleHeight);
            e.setVisibleHeight(panesVisibleHeight);
        });

        const visibleWidth = document.body.clientWidth;
        this.editorPanes.forEach(e => e.setVisibleWidth(visibleWidth));
    });
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

Editor.prototype.newTab = function(name = 'untitled') {
    const indexName = this._getIndexName(name);
    
    this.tabListView.add(indexName);
    this.tabListView.setSelected(indexName);
    
    const pane = new EditorPane(this.domNode, {
        name: name,
        indexName: indexName,
        keyMap: this.keyMaps['editor-default'],
        onKeyAction: (action) => this.handleAction(action),
        onKeyError: (error) => this.handleKeyError(error)
    });
    this.editorPanes.push(pane);
    
    const tabsHeight = this.tabListView.getHeight();
    const paneHeight = this.getHeight() - tabsHeight;
    pane.setHeight(paneHeight);
    pane.setTopOffset(tabsHeight);
    
    if (this.activePane) {
        this.activePane.setInactive();
    }
    this.activePane = pane;
    this.activePane.setActive();
};


// If _tabName is undefined, switches to the previously opened tab.
Editor.prototype.switchTab = function(_tabName = undefined) {
    if (this.activePane && _tabName === this.activePane.indexName) return;

    const prevActive = this._getPrevActivePane() || {};
    const indexName = _tabName || prevActive.indexName;
    const exists = this.tabListView.setSelected(indexName);
    if (!exists) {
        throw new Error('Editor: No tab with name ' + indexName);
    }

    const pane = this.editorPanes.find(e => e.indexName === indexName);
    
    if (this.activePane) {
        this.activePane.setInactive();
    }
    this.activePane = pane;
    this.activePane.setActive();
};

// If tabName is undefined, closes the active tab.
Editor.prototype.closeTab = function(tabName = undefined) {
    if (!tabName && !this.activePane) {
        throw new Error('Editor: No tabs to close.');
    }

    const indexName = tabName || this.activePane.indexName;
    const exists = this.tabListView.remove(indexName);
    if (!exists) {
        throw new Error('Editor: No tab with name ' + indexName);
    }

    const pos = this.editorPanes.findIndex(e => e.indexName === indexName);
    const pane = this.editorPanes.splice(pos, 1)[0];
    
    if (pane === this.activePane) {
        this.activePane = this._getPrevActivePane();
        if (this.activePane) {
            this.activePane.setActive();
            this.tabListView.setSelected(this.activePane.indexName);
        }
    }

    this.domNode.removeChild(pane.domNode);
};

Editor.prototype.toggleCommandModal = function() {
    this.commandModal.toggle();
    if (this.commandModal.isToggled()) {
        this.activePane.setInactive();
    } else {
        this.activePane.setActive();
    }
};

Editor.prototype.handleCommandModalAction = function(action) {
    this.commandModal.toggle();
    this.commandModal.clearInput();
    this.handleAction(action);
    if (this.activePane) {
        this.activePane.setActive();
        this.activePane.setCursorBlink(true);
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
        'CLOSE_TAB':                     action => this.closeTab(action.name)
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

// TODO: implement
Editor.prototype._getPrevActivePane = function() {
    return this.editorPanes[this.editorPanes.length - 1];
};

// If an editor pane exists with the same name as that given, returns a unique
// version of the name. Otherwise, returns the given name.
Editor.prototype._getIndexName = function(name) {    
    const suffixNum = this.editorPanes.reduce((prev, curr) => {
        if (prev === 0 && curr.indexName === name) {
            return prev + 1;
        }
        if (prev > 0) {
            // untitled-1 -> untitled
            const sansSuffix = curr.indexName.slice(0, curr.indexName.length - numDigitsIn(prev) - 1);
            if (sansSuffix === name) {
                return prev + 1;   
            }
        }

        return prev;
    }, 0);

    return suffixNum === 0 ? name : name + '-' + suffixNum;
};

module.exports.Editor = Editor;
