'use strict';

const BufferView = require('./bufferView.js');
const CursorView = require('./cursorView.js');
const GutterView = require('./gutterView.js');
const KeyListener = require('./keyListener.js');
const MouseListener = require('./mouseListener.js');

const defaults = {
    tabName: '',
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
    onUnknownAction: (action) => { throw new Error('Editor: No handler for action: ' + action); },
    onNameChanged: (oldName, newName) => { throw new Error('Editor: No handler for onNameChanged'); },
    onCursorMoved: (line, col) => { throw new Error('Editor: No handler for onCursorMoved.'); }
};

function Editor(parentElem, buffer, settings = defaults) {

    this.domNode = document.createElement('div');
    this.domNode.className = 'editor';
    this.domNode.style.height = settings.height || defaults.height;
    this.domNode.style.width = settings.width || defaults.width;
    this.domNode.style.top = settings.topOffset || defaults.topOffset;
    this.domNode.tabIndex = 1;
    parentElem.appendChild(this.domNode);

    this.buffer = buffer;
    this.tabName = settings.tabName || defaults.tabName;
    this.keyMap = settings.keyMap || defaults.keyMap;
    this.horizontalCursorMargin = settings.horizontalCursorMargin || defaults.horizontalCursorMargin;
    this.verticalCursorMargin = settings.verticalCursorMargin || defaults.verticalCursorMargin;
    this.onCursorMoved = settings.onCursorMoved || defaults.onCursorMoved;
    this.onUnknownAction = settings.onUnknownAction || defaults.onUnknownAction;
    this.onNameChanged = settings.onNameChanged || defaults.onNameChanged;
    
    const sharedEditorSettings = settings.sharedEditorComponentSettings || defaults.sharedEditorComponentSettings;
    this.charWidth = sharedEditorSettings.charWidth;
    this.charHeight = sharedEditorSettings.charHeight;    
    this.bufferView = new BufferView(this.domNode, Object.assign({}, {onClick: (line, col) => this._onBufferClick(line, col)}, sharedEditorSettings));
    this.cursorView = new CursorView(this.domNode, sharedEditorSettings);
    this.gutterView = new GutterView(this.domNode, Object.assign({}, {onWidthChanged: (width) => this._onGutterWidthChanged(width)}, sharedEditorSettings));
    this.mouseListener = new MouseListener(this.bufferView, this.cursorView, this.gutterView, {onCursorMoved: this.onCursorMoved});
    this.keyListener = new KeyListener(this.domNode, {
        keyMap: this.buffer.getMode().keyMap,
        allowDefaultOnKeyError: false,
        onKeyAction: (action) => this._handleAction(action),
        onKeyError: (error) => this._handleKeyError(error)
    });

    this._initComponents();
    this._initEventListeners();

    // Inactive by default.
    this.setInactive();
}

Editor.prototype._initComponents = function() {
    this.cursorView.setLeftOffset(this.gutterView.getWidth());
    this.bufferView.setLeftOffset(this.gutterView.getWidth()); 
    this.bufferView.setVisibleHeight(this.getHeight());
    this.bufferView.setVisibleWidth(this.getWidth() - this.gutterView.getWidth());
    
    if (this.buffer.hasFile()) {
        try {
            this.buffer.reloadFromFile();
            const lines = this.buffer.getLines();
            lines.forEach(e => {
                this.bufferView.appendLine(e);
                this.gutterView.appendLine();
            });
            if (lines.length > 0) {
                this.gutterView.setActiveLine(0);
            }
            return;
        } catch (e) {
            // TODO: Show error dialog.
            console.warn(e);
        }
    } 
    this.buffer.appendLine();
    this.bufferView.appendLine();
    this.gutterView.appendLine();
    this.gutterView.setActiveLine(0);
};

Editor.prototype._initEventListeners = function() {
    this.domNode.addEventListener('scroll', (e) => {
        this.bufferView.setScrollTop(this.domNode.scrollTop);
        this.bufferView.setScrollLeft(this.domNode.scrollLeft);
        this.gutterView.setLeftOffset(this.domNode.scrollLeft);
    });
};

Editor.prototype._onGutterWidthChanged = function(width) {
    this.cursorView.setLeftOffset(width);
    this.bufferView.setLeftOffset(width);
};

Editor.prototype.insert = function(text) {
    this.bufferView.clearSelection();
    this.buffer.insert(this.cursorView.line, this.cursorView.col, text);
    this.bufferView.setLine(this.cursorView.line, this.buffer.getLine(this.cursorView.line));
    this.cursorView.moveRight(text.length);

    this._onCursorMoved();
};

Editor.prototype.insertNewLine = function() {
    this.bufferView.clearSelection();
    this.openLine();
    this.cursorView.moveTo(this.cursorView.line + 1, 0); 
    this.gutterView.setActiveLine(this.cursorView.line);

    this._onCursorMoved();
};

Editor.prototype.openLine = function() {
    this.bufferView.clearSelection();
    this.buffer.insertNewLine(this.cursorView.line, this.cursorView.col);
    this.bufferView.setLine(this.cursorView.line, this.buffer.getLine(this.cursorView.line));
    this.bufferView.insertLine(this.cursorView.line + 1, this.buffer.getLine(this.cursorView.line + 1));
    this.gutterView.appendLine();
};

Editor.prototype.deleteBackChar = function() {
    if (this.bufferView.hasSelection()) {
        this.deleteSelection();
        return;
    }
    if (this.cursorView.col === 0) {
        if (this.cursorView.line === 0) {
            return;
        }

        const prevLine = this.buffer.getLine(this.cursorView.line - 1);
        const line = prevLine + this.buffer.getLine(this.cursorView.line);
        this.buffer.setLine(this.cursorView.line - 1, line);
        this.buffer.deleteLine(this.cursorView.line);
        this.bufferView.setLine(this.cursorView.line - 1, line);
        this.bufferView.removeLine(this.cursorView.line);
        this.cursorView.moveTo(this.cursorView.line - 1, prevLine.length);
        this.gutterView.setActiveLine(this.cursorView.line);
        this.gutterView.removeLine();
    } else {
        this.buffer.deleteBack(this.cursorView.line, this.cursorView.col);
        this.bufferView.setLine(this.cursorView.line, this.buffer.getLine(this.cursorView.line));
        this.cursorView.moveLeft();
    }

    this._onCursorMoved();
};


Editor.prototype.deleteForwardChar = function() {
    this.bufferView.clearSelection();
    if (this.cursorView.col === this.buffer.getLine(this.cursorView.line).length) {
        if (this.cursorView.line === this.buffer.getLastLineNum()) {
            return;
        }

        const currLine = this.buffer.getLine(this.cursorView.line);
        const nextLine = this.buffer.getLine(this.cursorView.line + 1);
        this.buffer.setLine(this.cursorView.line, currLine + nextLine);
        this.buffer.deleteLine(this.cursorView.line + 1);
        this.bufferView.removeLine(this.cursorView.line + 1);
        this.bufferView.setLine(this.cursorView.line, this.buffer.getLine(this.cursorView.line));
    } else {
        this.buffer.deleteForward(this.cursorView.line, this.cursorView.col);
        this.bufferView.setLine(this.cursorView.line, this.buffer.getLine(this.cursorView.line));
    }
};

Editor.prototype.deleteBackWord = function() {
    const [line, col] = this.buffer.getLastWordStart(this.cursorView.line, this.cursorView.col);
    this._deleteRange(line, col, this.cursorView.line, this.cursorView.col);
};

Editor.prototype.deleteForwardWord = function() {
    const [line, col] = this.buffer.getNextWordEnd(this.cursorView.line, this.cursorView.col);
    this._deleteRange(this.cursorView.line, this.cursorView.col, line, col);
};

Editor.prototype.deleteSelection = function() {
    const {startLine, startCol, endLine, endCol} = this.bufferView.getSelectionRange().splat();
    this._deleteRange(startLine, startCol, endLine, endCol);
};

// Moves the cursor to the start of the range and clears the buffer's active selection.
Editor.prototype._deleteRange = function(startLine, startCol, endLine, endCol) {
    this.bufferView.clearSelection();
    this.buffer.deleteRange(startLine, startCol, endLine, endCol);
    for (let i = startLine; i < endLine; i++) {
        this.bufferView.removeLine(startLine);
        this.gutterView.removeLine(startLine);
    }
    this.bufferView.setLine(startLine, this.buffer.getLine(startLine));
    if (startLine !== this.cursorView.line || startCol !== this.cursorView.col) {
        this.gutterView.setActiveLine(startLine);
        this.cursorView.moveTo(startLine, startCol);
        this._onCursorMoved();        
    }
};

Editor.prototype.killLine = function() {
    this.bufferView.clearSelection();
    if (this.cursorView.col === this.buffer.getLine(this.cursorView.line).length) {
        if (this.cursorView.line === this.buffer.getLastLineNum()) {
            return;
        }

        const nextLine = this.buffer.getLine(this.cursorView.line);
        this.buffer.deleteLine(this.cursorView.line);
        this.buffer.setLine(this.cursorView.line, this.buffer.getLine(this.cursorView.line) + nextLine);
        this.bufferView.removeLine(this.cursorView.line + 1);
        this.bufferView.setLine(this.cursorView.line, this.buffer.getLine(this.cursorView.line));
        this.gutterView.removeLine();
    } else {
        const line = this.buffer.getLine(this.cursorView.line);
        const upToPoint = line.slice(0, this.cursorView.col);
        this.buffer.copyRange(this.cursorView.line, this.cursorView.col, this.cursorView.line, line.length);
        this.buffer.setLine(this.cursorView.line, upToPoint);
        this.bufferView.setLine(this.cursorView.line, upToPoint);
    }
};

Editor.prototype.copySelection = function() {
    if (this.bufferView.hasSelection()) {
        const {startLine, startCol, endLine, endCol} = this.bufferView.getSelectionRange().splat();
        this.buffer.copyRange(startLine, startCol, endLine, endCol);
    }
};

Editor.prototype.killSelection = function() {
    this.copySelection();
    this.deleteSelection();
};

Editor.prototype.paste = function() {
    this.bufferView.clearSelection();
    const endingPos = this.buffer.pasteAt(this.cursorView.line, this.cursorView.col);
    if (endingPos) {
        const [endLine, endCol] = endingPos;
        this.bufferView.setLine(this.cursorView.line, this.buffer.getLine(this.cursorView.line));
        for (let i = this.cursorView.line + 1; i <= endLine; i++) {
            this.bufferView.insertLine(i, this.buffer.getLine(i));
            this.gutterView.appendLine();
        }
        this.cursorView.moveTo(endLine, endCol);
        this.gutterView.setActiveLine(endLine);
        
        this._onCursorMoved();
    }
};

// If term is given, starts a new search for term starting at the current cursor position.
// Otherwise, attempts to cycle to the next active match of the previous search term.
Editor.prototype.search = function(term, direction) {
    this.bufferView.clearSelection();
    const match = this.buffer.search(term, direction, this.cursorView.line, this.cursorView.col);
    if (match) {
        this.cursorView.moveTo(match[0], match[1]);
        this._onCursorMoved();
    }
};

Editor.prototype.saveBuffer = function(as) {
    try {
        this.buffer.save(as);
        if (as && as !== this.tabName) {
            const base = this.buffer.getFileBaseName();
            this.onNameChanged(this.tabName, base);
            this.tabName = base;
        }
    } catch (e) {
        // TODO: Implement.
        console.warn(e);
    }
};

Editor.prototype.moveCursorLeft = function() {
    this.bufferView.clearSelection();
    if (this.cursorView.col === 0) {
        if (this.cursorView.line === 0) {
            return;
        }
        const endOfPrevLine = this.buffer.getLine(this.cursorView.line).length;
        this.cursorView.moveTo(this.cursorView.line - 1, endOfPrevLine);
        this.gutterView.setActiveLine(this.cursorView.line);
    } else {
        this.cursorView.moveLeft();
    }

    this._onCursorMoved();
};

Editor.prototype.moveCursorRight = function() {
    this.bufferView.clearSelection();
    if (this.cursorView.col === this.buffer.getLine(this.cursorView.line).length) {
        if (this.cursorView.line === this.buffer.getLastLineNum()) {
            return;
        }
        this.cursorView.moveTo(this.cursorView.line + 1, 0);
        this.gutterView.setActiveLine(this.cursorView.line);
    } else {
        this.cursorView.moveRight();
    }

    this._onCursorMoved();
};

Editor.prototype.moveCursorUp = function() {
    if (this.cursorView.line === 0) {
        return;
    }

    this.bufferView.clearSelection();
    this.cursorView.moveUp();
    this.gutterView.setActiveLine(this.cursorView.line);
    const lineWidth = this.buffer.getLine(this.cursorView.line).length;
    if (this.cursorView.col > lineWidth) {
        this.cursorView.setCol(lineWidth);
    }

    this._onCursorMoved();
};

Editor.prototype.moveCursorDown = function() {
    if (this.cursorView.line === this.buffer.getLastLineNum()) {
        return;
    }

    this.bufferView.clearSelection();
    this.cursorView.moveDown();
    this.gutterView.setActiveLine(this.cursorView.line);
    const lineWidth = this.buffer.getLine(this.cursorView.line).length;
    if (this.cursorView.col > lineWidth) {
        this.cursorView.setCol(lineWidth);
    }

    this._onCursorMoved();
};

Editor.prototype.moveCursorForwardWord = function() {
    this.bufferView.clearSelection();
    const [line, col] = this.buffer.getNextWordEnd(this.cursorView.line, this.cursorView.col);
    this.cursorView.moveTo(line, col);

    this._onCursorMoved();
};

Editor.prototype.moveCursorBackWord = function() {
    this.bufferView.clearSelection();
    const [line, col] = this.buffer.getLastWordStart(this.cursorView.line, this.cursorView.col);
    this.cursorView.moveTo(line, col);

    this._onCursorMoved();
};

Editor.prototype.moveCursorBeginningOfLine = function() {
    this.bufferView.clearSelection();
    this.cursorView.setCol(0);
    this.cursorView.goalCol = this.cursorView.col;

    this._onCursorMoved();
};

Editor.prototype.moveCursorEndOfLine = function() {
    this.bufferView.clearSelection();
    this.cursorView.setCol(this.buffer.getLine(this.cursorView.line).length);
    this.cursorView.goalCol = this.cursorView.col;

    this._onCursorMoved();
};

Editor.prototype.moveCursorTo = function(line, col) {
    if (line >= 0 && line <= this.buffer.getLastLineNum() &&
        col >= 0 && col <= this.buffer.getLine(line).length) {
        this.bufferView.clearSelection();
        this.cursorView.moveTo(line, col);
        this.gutterView.setActiveLine(this.cursorView.line);
        
        this._onCursorMoved();
    }
};

Editor.prototype.getCursorRelPosition = function() {
    const first = this.bufferView.getFirstVisibleLineNum();
    const height = this.bufferView.getVisibleHeightLines();
    const ratio = (this.cursorView.line - first) / height;
    if (ratio < 0.25) return 'buffer-top';
    if (ratio < 0.75) return 'buffer-middle';
    else              return 'buffer-bottom';
};

Editor.prototype.toggleCursorRelPosition = function() {
    const cursorRelPosition = this.getCursorRelPosition();
    if (cursorRelPosition === 'buffer-top') {
        const halfHeight = Math.round(this.bufferView.getVisibleHeightLines() / 2);
        this.scrollToLine(Math.max(this.cursorView.line - halfHeight + 1, 0));
    } else if (cursorRelPosition === 'buffer-middle') {
        const fullHeight = this.bufferView.getVisibleHeightLines();
        this.scrollToLine(Math.max(this.cursorView.line - fullHeight + 1, 0));
    } else {
        this.scrollToLine(this.cursorView.line);
    }
};

// Sets the given line as the first visible.
Editor.prototype.scrollToLine = function(line) {
    const scrollTop = line * this.charHeight;
    this.domNode.scrollTop = scrollTop;
    this.bufferView.setScrollTop(scrollTop);
};

// Sets the given column as the first visible. 
Editor.prototype.scrollToCol = function(col) {
    const scrollLeft = col * this.charWidth;
    this.domNode.scrollLeft = scrollLeft;
    this.bufferView.setScrollLeft(scrollLeft);
    this.gutterView.setLeftOffset(scrollLeft);
};

Editor.prototype.show = function() {
    if (!this.isVisible()) {
        this.cursorView.show();
        this.domNode.classList.remove('editor-hidden');
    }    
};

Editor.prototype.hide = function() {
    if (this.isVisible()) {
        this.cursorView.hide();
        this.domNode.classList.add('editor-hidden');
    }    
};

Editor.prototype.isVisible = function() {
    return !this.domNode.classList.contains('editor-hidden');
};

Editor.prototype.showGutter = function() {
    if (!this.gutterView.isVisible()) {
        this.gutterView.show();
        const width = this.gutterView.getWidth();
        this.bufferView.setLeftOffset(width);
        this.cursorView.setLeftOffset(width);
    }
};

Editor.prototype.hideGutter = function() {
    if (this.gutterView.isVisible()) {
        this.gutterView.hide();
        const width = this.gutterView.getWidth();
        this.bufferView.setLeftOffset(width);
        this.cursorView.setLeftOffset(width);
    }
};

Editor.prototype.setActive = function(on) {
    this.cursorView.setBlink(true);
    this.domNode.focus();
    this.mouseListener.setActive();
    this.domNode.classList.remove('editor-inactive');    
};

Editor.prototype.setInactive = function() {
    this.cursorView.setBlink(false);
    this.domNode.blur();
    this.mouseListener.setActive();
    this.domNode.classList.add('editor-inactive');    
};

Editor.prototype.isActive = function() {
    return !this.domNode.classList.contains('editor-inactive');
};

Editor.prototype.setCursorBlink = function(on) {
    this.cursorView.setBlink(on);
};

Editor.prototype.setLeftOffset = function(to) {
    this.domNode.style.left = to + 'px';
};

Editor.prototype.setTopOffset = function(to) {
    this.domNode.style.top = to + 'px';
};

Editor.prototype.setHeight = function(to) {
    this.domNode.style.height = to + 'px';
    this.bufferView.setVisibleHeight(this.getHeight());
};

Editor.prototype.getHeight = function() {
    const height = parseInt(this.domNode.style.height);
    if (height == null) {
        throw new Error('Editor: Unable to parse height.');
    }
    return height;
};

Editor.prototype.setWidth = function(to) {
    this.domNode.style.width = to + 'px';
    this.bufferView.setVisibleWidth(this.getWidth() - this.gutterView.getWidth());
};

Editor.prototype.getWidth = function() {
    const width = parseInt(this.domNode.style.width);
    if (width == null) {
        throw new Error('Editor: Unable to parse width.');
    }
    return width;
};

Editor.prototype.getCursorPosition = function() {
    return [this.cursorView.line, this.cursorView.col];
};

Editor.prototype.getModeName = function() {
    return this.buffer.getMode().name;
};

Editor.prototype.hasUnsavedChanges = function() {
    return this.buffer.hasUnsavedChanges();
};

Editor.prototype._onCursorMoved = function() {
    this._checkScrollCursorIntoView();
    this.onCursorMoved(this.cursorView.line, this.cursorView.col);
};

Editor.prototype._checkScrollCursorIntoView = function() {

    // Horizontal alignment
    if (this.cursorView.col < this.bufferView.getFirstVisibleCol() + this.horizontalCursorMargin) {
        const firstVisible = Math.max(0, this.cursorView.col - this.horizontalCursorMargin);
        this.scrollToCol(firstVisible);
    } else if (this.cursorView.col > this.bufferView.getLastVisibleCol() - this.horizontalCursorMargin) {
        const lastVisible = Math.min(this.cursorView.col + this.horizontalCursorMargin, this.bufferView.getLastColNum());
        const firstVisible = lastVisible - this.bufferView.getVisibleWidthCols() + 1;
        this.scrollToCol(firstVisible);
    }

    // Vertical alignment
    if (this.cursorView.line < this.bufferView.getFirstVisibleLineNum() + this.verticalCursorMargin) {
        const firstVisible = Math.max(0, this.cursorView.line - this.verticalCursorMargin);
        this.scrollToLine(firstVisible); 
    } else if (this.cursorView.line > this.bufferView.getLastVisibleLineNum() - this.verticalCursorMargin) {
        const lastVisible = Math.min(this.cursorView.line + this.verticalCursorMargin, this.buffer.getLastLineNum());
        const firstVisible = lastVisible - this.bufferView.getVisibleHeightLines() + 1;
        this.scrollToLine(firstVisible);
    }

};

Editor.prototype._handleAction = function(action) {

    const actionHandlers = {
        'INSERT':                        (action) => this.insert(action.text),
        'INSERT_NEW_LINE':               () => this.insertNewLine(),
        'OPEN_LINE':                     () => this.openLine(),
        'DELETE_BACK_CHAR':              () => this.deleteBackChar(),
        'DELETE_FORWARD_CHAR':           () => this.deleteForwardChar(),
        'DELETE_FORWARD_WORD':           () => this.deleteForwardWord(),
        'DELETE_BACK_WORD':              () => this.deleteBackWord(),
        'KILL_LINE':                     () => this.killLine(),
        'KILL_SELECTION':                () => this.killSelection(),
        'COPY_SELECTION':                () => this.copySelection(),
        'PASTE':                         () => this.paste(),
        'TOGGLE_CURSOR_REL_POS':         () => this.toggleCursorRelPosition(),
        'MOVE_TO_POS':                   (action) => this.moveCursorTo(action.line - 1, action.col - 1),
        'MOVE_CURSOR_LEFT':              () => this.moveCursorLeft(),
        'MOVE_CURSOR_RIGHT':             () => this.moveCursorRight(),
        'MOVE_CURSOR_UP':                () => this.moveCursorUp(),
        'MOVE_CURSOR_DOWN':              () => this.moveCursorDown(),
        'MOVE_CURSOR_FORWARD_WORD':      () => this.moveCursorForwardWord(),
        'MOVE_CURSOR_BACK_WORD':         () => this.moveCursorBackWord(),
        'MOVE_CURSOR_BEGINNING_OF_LINE': () => this.moveCursorBeginningOfLine(),
        'MOVE_CURSOR_END_OF_LINE':       () => this.moveCursorEndOfLine(),
        'SHOW_GUTTER':                   () => this.showGutter(),
        'HIDE_GUTTER':                   () => this.hideGutter(),
        'SEARCH_FORWARD':                (action) => this.search(action.text, 'forward'),
        'SEARCH_BACK':                   (action) => this.search(action.text, 'back'),
        'SAVE_BUFFER':                   () => this.saveBuffer(),
        'SAVE_BUFFER_AS':                (action) => this.saveBuffer(action.name)
    };

    const handler = actionHandlers[action.type];

    if (handler) {
        handler(action);
    } else {
        this.onUnknownAction(action);
    }
};

Editor.prototype._handleKeyError = function(error) {
    console.log('Editor: key error: ' + error);
};

module.exports = Editor;
