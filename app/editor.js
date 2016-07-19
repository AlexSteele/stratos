'use strict';

const {EditorPane} = require('./editorPane.js');
const {CommandModal} = require('./commandModal.js');
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
    const tabName = this._getUniqueTabName(name);
    const tabsHeight = this.tabListView.getHeight();
    const paneHeight = this.getHeight() - tabsHeight;
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
    this.activePane.unHide();
    this.activePane.setActive();

    this.tabListView.setSelected(this.activePane.tabName);
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
    } else if (pane === this.prevActivePane) {
        this.prevActivePane = this.editorPanes.find(e => e !== this.activePane) || null;
    }
};

Editor.prototype.toggleCommandModal = function() {
    this.commandModal.toggle();
    if (this.commandModal.isToggled()) {
        this.activePane.setInactive();
        this.tabListView.setInactive();
    } else {
        this.activePane.setActive();
        this.tabListView.setActive();
    }
};

Editor.prototype.handleCommandModalAction = function(action) {
    this.commandModal.clearInput();
    this.commandModal.toggle();
    this.handleAction(action);
    if (this.activePane) {
        this.activePane.setActive();
        this.tabListView.setActive();
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

Editor.prototype._getPrevActivePane = function() {
    return this.editorPanes[this.editorPanes.length - 1];
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
