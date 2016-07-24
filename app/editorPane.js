'use strict';

// TODO: Make line, col indexing consistent between model and view.

const BufferModel = require('./bufferModel.js');
const BufferView = require('./bufferView.js');
const CursorView = require('./cursorView.js');
const GutterView = require('./gutterView.js');
const KeyListener = require('./keyListener.js');

const defaults = {
    name: '',
    tabName: '', // A unique identifier. May be the same as the pane's name. 
    keyMap: {},
    horizontalCursorMargin: 1,  // columns
    verticalCursorMargin: 1,    // lines
    height: '100%',
    width: '100%',
    topOffset: '0px',
    sharedEditorComponentSettings: {
        charWidth: 0,
        charheight: 0
    },
    onUnknownAction: (action) => { throw new Error('EditorPane: No handler for action: ' + action); },
    onCursorMoved: (line, col) => { throw new Error('EditorPane: No handler for onCursorMoved.'); }
};

function EditorPane(parentElem, settings = defaults) {

    this.domNode = document.createElement('div');
    this.domNode.className = 'editor-pane';
    this.domNode.style.height = settings.height || defaults.height;
    this.domNode.style.width = settings.width || defaults.width;
    this.domNode.style.top = settings.topOffset || defaults.topOffset;
    this.domNode.tabIndex = 1;
    parentElem.appendChild(this.domNode);

    this.model = new BufferModel();

    this.name = settings.name || defaults.name;
    this.tabName = settings.tabName || defaults.tabName;
    this.keyMap = settings.keyMap || defaults.keyMap;
    this.onCursorMoved = settings.onCursorMoved || defaults.onCursorMoved;
    this.onUnknownAction = settings.onUnknownAction || defaults.onUnknownAction;
    this.horizontalCursorMargin = settings.horizontalCursorMargin || defaults.horizontalCursorMargin;
    this.verticalCursorMargin = settings.verticalCursorMargin || defaults.verticalCursorMargin;
    
    const sharedEditorSettings = settings.sharedEditorComponentSettings || defaults.sharedEditorComponentSettings;
    this.charWidth = sharedEditorSettings.charWidth;
    this.charHeight = sharedEditorSettings.charHeight;    
    this.gutterView = new GutterView(this.domNode, Object.assign({}, {onWidthChanged: (width) => this._onGutterWidthChanged(width)}, sharedEditorSettings));
    this.bufferView = new BufferView(this.domNode, Object.assign({}, {onClick: (line, col) => this._onBufferClick(line, col)}, sharedEditorSettings));
    this.cursorView = new CursorView(this.domNode, sharedEditorSettings);

    this.keyListener = new KeyListener(this.domNode, {
        keyMap: this.keyMap,
        allowDefaultOnKeyError: false,
        onKeyAction: (action) => this._handleAction(action),
        onKeyError: (error) => this._handleKeyError(error)
    });

    this._initComponents();
    this._initEventListeners();
}

EditorPane.prototype._initComponents = function() {
    this.model.appendLine();
    this.cursorView.setLeftOffset(this.gutterView.getWidth());
    this.bufferView.setLeftOffset(this.gutterView.getWidth()); 
    this.bufferView.setVisibleHeight(this.getHeight());
    this.bufferView.setVisibleWidth(this.getWidth() - this.gutterView.getWidth());
};

EditorPane.prototype._initEventListeners = function() {
    this.domNode.addEventListener('scroll', (e) => {
        this.bufferView.setScrollTop(this.domNode.scrollTop);
        this.bufferView.setScrollLeft(this.domNode.scrollLeft);
        this.gutterView.setLeftOffset(this.domNode.scrollLeft);
    });
};

EditorPane.prototype._onBufferClick = function(line, col) {
    this.cursorView.moveTo(line, col);
    this.gutterView.setActiveLine(line);
    this.onCursorMoved(line, col);
};

EditorPane.prototype._onGutterWidthChanged = function(width) {
    this.cursorView.setLeftOffset(width);
    this.bufferView.setLeftOffset(width);
};

EditorPane.prototype.insert = function(text) {
    this.model.insert(this.cursorView.line - 1, this.cursorView.col - 1, text);
    this.bufferView.setLine(this.cursorView.line, this.model.getLine(this.cursorView.line - 1));
    this.cursorView.moveRight(text.length);

    this._checkScrollCursorIntoView();
    this._emitCursorMoved();
};

EditorPane.prototype.insertNewLine = function() {
    this.model.insertNewLine(this.cursorView.line - 1, this.cursorView.col - 1);
    this.bufferView.setLine(this.cursorView.line, this.model.getLine(this.cursorView.line - 1));
    this.bufferView.insertLine(this.cursorView.line + 1, this.model.getLine(this.cursorView.line));
    this.cursorView.moveTo(this.cursorView.line + 1, 1);
    this.gutterView.appendLine();
    this.gutterView.setActiveLine(this.cursorView.line);

    this._checkScrollCursorIntoView();
    this._emitCursorMoved();
};

EditorPane.prototype.deleteBackChar = function() {
    if (this.cursorView.col === 1) {
        if (this.cursorView.line === 1) {
            return;
        }

        // TODO: Move logic into model.

        const prevLine = this.model.getLine(this.cursorView.line - 2);
        const line = prevLine + this.model.getLine(this.cursorView.line - 1);
        this.model.setLine(this.cursorView.line - 2, line);
        this.model.deleteLine(this.cursorView.line - 1);
        
        this.bufferView.setLine(this.cursorView.line - 1, line);
        this.bufferView.removeLine(this.cursorView.line);
        this.cursorView.moveTo(this.cursorView.line - 1, prevLine.length + 1);
        this.gutterView.setActiveLine(this.cursorView.line);
        this.gutterView.removeLine();
    } else {
        this.model.deleteBack(this.cursorView.line - 1, this.cursorView.col - 1);
        this.bufferView.setLine(this.cursorView.line, this.model.getLine(this.cursorView.line - 1));
        this.cursorView.moveLeft();
    }

    this._checkScrollCursorIntoView();
    this._emitCursorMoved();
};

EditorPane.prototype.deleteForwardChar = function() {
    if (this.cursorView.col === this.bufferView.getLineWidthCols(this.cursorView.line) + 1) {
        if (this.cursorView.line === this.bufferView.getLastLineNum()) {
            return;
        }

        // TODO: ^ Ditto ^

        const nextLine = this.model.getLine(this.cursorView.line);
        this.model.setLine(this.cursorView.line - 1,
                           this.model.getLine(this.cursorView.line - 1) + nextLine);
        this.model.deleteLine(this.cursorView.line);
        this.bufferView.removeLine(this.cursorView.line + 1);
        this.bufferView.setLine(this.cursorView.line, this.model.getLine(this.cursorView.line - 1));
    } else {
        this.model.deleteForward(this.cursorView.line - 1, this.cursorView.col - 1);
        this.bufferView.setLine(this.cursorView.line, this.model.getLine(this.cursorView.line - 1));
    }
};

EditorPane.prototype.killLine = function() {
    if (this.cursorView.col === this.bufferView.getLineWidthCols(this.cursorView.line) + 1) {
        if (this.cursorView.line === this.bufferView.getLastLineNum()) {
            return;
        }

        // TODO: Ditto
        
        const nextLine = this.model.getLine(this.cursorView.line);
        this.model.deleteLine(this.cursorView.line);
        this.model.setLine(this.cursorView.line - 1, this.model.getLine(this.cursorView.line - 1) + nextLine);
        this.bufferView.removeLine(this.cursorView.line + 1);
        this.bufferView.setLine(this.cursorView.line, this.model.getLine(this.cursorView.line - 1));
        this.gutterView.removeLine();
    } else {
        const lineUpToPoint = this.model.getLine(this.cursorView.line - 1).slice(0, this.cursorView.col - 1);
        this.model.setLine(this.cursorView.line - 1, lineUpToPoint);
        this.bufferView.setLine(this.cursorView.line, lineUpToPoint);
    }
};

EditorPane.prototype.moveCursorLeft = function() {
    if (this.cursorView.col === 1) {
        if (this.cursorView.line === 1) {
            return;
        }
        const endOfPrevLine = this.bufferView.getLineWidthCols(this.cursorView.line - 1) + 1;
        this.cursorView.moveTo(this.cursorView.line - 1, endOfPrevLine);
        this.gutterView.setActiveLine(this.cursorView.line);
    } else {
        this.cursorView.moveLeft();
    }

    this._checkScrollCursorIntoView();
    this._emitCursorMoved();
};

EditorPane.prototype.moveCursorRight = function() {
    if (this.cursorView.col === this.bufferView.getLineWidthCols(this.cursorView.line) + 1) {
        if (this.cursorView.line === this.bufferView.getLastLineNum()) {
            return;
        }
        this.cursorView.moveTo(this.cursorView.line + 1, 1);
        this.gutterView.setActiveLine(this.cursorView.line);
    } else {
        this.cursorView.moveRight();
    }

    this._checkScrollCursorIntoView();
    this._emitCursorMoved();
};

EditorPane.prototype.moveCursorUp = function() {
    if (this.cursorView.line === 1) {
        return;
    }
    
    this.cursorView.moveUp();
    this.gutterView.setActiveLine(this.cursorView.line);
    const lineWidth = this.bufferView.getLineWidthCols(this.cursorView.line);
    if (this.cursorView.col > lineWidth + 1) {
        this.cursorView.setCol(lineWidth + 1);
    }

    this._checkScrollCursorIntoView();
    this._emitCursorMoved();
};

EditorPane.prototype.moveCursorDown = function() {
    if (this.cursorView.line === this.bufferView.getLastLineNum()) {
        return;
    }
    
    this.cursorView.moveDown();
    this.gutterView.setActiveLine(this.cursorView.line);
    const lineWidth = this.bufferView.getLineWidthCols(this.cursorView.line);
    if (this.cursorView.col > lineWidth + 1) {
        this.cursorView.setCol(lineWidth + 1);
    }

    this._checkScrollCursorIntoView();
    this._emitCursorMoved();
};

EditorPane.prototype.moveCursorBeginningOfLine = function() {
    this.cursorView.setCol(1);
    this.cursorView.goalCol = this.cursorView.col;

    this._checkScrollCursorIntoView();
    this._emitCursorMoved();
};

EditorPane.prototype.moveCursorEndOfLine = function() {
    this.cursorView.setCol(this.bufferView.getLineWidthCols(this.cursorView.line) + 1);
    this.cursorView.goalCol = this.cursorView.col;

    this._checkScrollCursorIntoView();
    this._emitCursorMoved();
};

EditorPane.prototype.moveCursorTo = function(line, col) {
    if (line >= 1 && line <= this.bufferView.getLastLineNum() &&
        col >= 1 && col <= this.bufferView.getLineWidthCols(line) + 1) {
        this.cursorView.moveTo(line, col);
        this.gutterView.setActiveLine(this.cursorView.line);
        
        this._checkScrollCursorIntoView();
        this._emitCursorMoved();
        
        return true;
    }
    return false;
};

// Sets the given line as the first visible.
EditorPane.prototype.scrollToLine = function(line) {
    const scrollTop = (line - 1) * this.charHeight;
    this.domNode.scrollTop = scrollTop;
    this.bufferView.setScrollTop(scrollTop);
};

// Sets the given column as the first visible. 
EditorPane.prototype.scrollToCol = function(col) {
    const scrollLeft = (col - 1) * this.charWidth;
    this.domNode.scrollLeft = scrollLeft;
    this.bufferView.setScrollLeft(scrollLeft);
    this.gutterView.setLeftOffset(scrollLeft);
};

EditorPane.prototype.show = function() {
    if (!this.isVisible()) {
        this.cursorView.show();
        this.domNode.classList.remove('editor-pane-hidden');
    }    
};

EditorPane.prototype.hide = function() {
    if (this.isVisible()) {
        this.cursorView.hide();
        this.domNode.classList.add('editor-pane-hidden');
    }    
};

EditorPane.prototype.isVisible = function() {
    return !this.domNode.classList.contains('editor-pane-hidden');
};

EditorPane.prototype.showGutter = function() {
    if (!this.gutterView.isVisible()) {
        this.gutterView.show();
        const width = this.gutterView.getWidth();
        this.bufferView.setLeftOffset(width);
        this.cursorView.setLeftOffset(width);    
    }    
};

EditorPane.prototype.hideGutter = function() {
    if (this.gutterView.isVisible()) {
        this.gutterView.hide();
        const width = this.gutterView.getWidth();
        this.bufferView.setLeftOffset(width);
        this.cursorView.setLeftOffset(width);        
    }
};

EditorPane.prototype.setActive = function(on) {
    this.cursorView.setBlink(true);
    this.domNode.focus();
    this.domNode.classList.remove('editor-pane-inactive');    
};

EditorPane.prototype.setInactive = function() {
    this.cursorView.setBlink(false);
    this.domNode.blur();
    this.domNode.classList.add('editor-pane-inactive');    
};

EditorPane.prototype.setCursorBlink = function(on) {
    this.cursorView.setBlink(on);
};

EditorPane.prototype.setLeftOffset = function(to) {
    this.domNode.style.left = to + 'px';
};

EditorPane.prototype.setTopOffset = function(to) {
    this.domNode.style.top = to + 'px';
};

EditorPane.prototype.setHeight = function(to) {
    this.domNode.style.height = to + 'px';
    this.bufferView.setVisibleHeight(this.getHeight());
};

EditorPane.prototype.setWidth = function(to) {
    this.domNode.style.width = to + 'px';
    this.bufferView.setVisibleWidth(this.getWidth() - this.gutterView.getWidth());
};

EditorPane.prototype.getCursorPosition = function() {
    return [this.cursorView.line, this.cursorView.col];
};

EditorPane.prototype.getHeight = function() {
    const height = parseInt(this.domNode.style.height);
    if (height == null) {
        throw new Error('EditorPane: Unable to parse height.');
    }
    return height;
};

EditorPane.prototype.getWidth = function() {
    const width = parseInt(this.domNode.style.width);
    if (width == null) {
        throw new Error('EditorPane: Unable to parse width.');
    }
    return width;
};

EditorPane.prototype._checkScrollCursorIntoView = function() {

    // Horizontal alignment
    if (this.cursorView.col < this.bufferView.getFirstVisibleCol() + this.horizontalCursorMargin) {
        const firstVisible = Math.max(1, this.cursorView.col - 10);
        this.scrollToCol(firstVisible);
    } else if (this.cursorView.col > this.bufferView.getLastVisibleCol() - this.horizontalCursorMargin) {
        const lastVisible = Math.min(this.cursorView.col + 10, this.bufferView.getLastColNum());
        const firstVisible = lastVisible - this.bufferView.getVisibleWidthCols() + 1;
        this.scrollToCol(firstVisible);
    }

    // Vertical alignment
    if (this.cursorView.line < this.bufferView.getFirstVisibleLineNum() + this.verticalCursorMargin) {
        const firstVisible = Math.max(1, this.cursorView.line - 10);
        this.scrollToLine(firstVisible); 
    } else if (this.cursorView.line > this.bufferView.getLastVisibleLineNum() - this.verticalCursorMargin) {
        const lastVisible = Math.min(this.cursorView.line + 10, this.bufferView.getLastLineNum());
        const firstVisible = lastVisible - this.bufferView.getVisibleHeightLines() + 1;
        this.scrollToLine(firstVisible);
    }

};

EditorPane.prototype._handleAction = function(action) {

    const actionHandlers = {
        'INSERT':                        action => this.insert(action.text),
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
        'SHOW_GUTTER':                   () => this.showGutter(),
        'HIDE_GUTTER':                   () => this.hideGutter()
    };

    const handler = actionHandlers[action.type];

    if (handler) {
        handler(action);
    } else {
        this.onUnknownAction(action);
    }
};

EditorPane.prototype._handleKeyError = function(error) {
    console.log('EditorPane: key error: ' + error);
};

EditorPane.prototype._emitCursorMoved = function() {
    this.onCursorMoved(this.cursorView.line, this.cursorView.col);
};

module.exports = EditorPane;
