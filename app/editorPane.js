'use strict';

const {BufferView} = require('./bufferView.js');
const {CursorView} = require('./cursorView.js');
const {GutterView} = require('./gutterView.js');
const {getSharedViewSettings} = require('./viewHelpers.js');

const defaults = {
    horizontalCursorMargin: 10, // columns
    verticalCursorMargin: 10,   // lines
    windowElem: window
};

function EditorPane(parentElem, settings = defaults) {

    this.horizontalCursorMargin = settings.horizontalCursorMargin || defaults.horizontalCursorMargin;
    this.verticalCursorMargin = settings.verticalCursorMargin || defaults.verticalCursorMargin;
    this.windowElem = settings.windowElem || defaults.windowElem;

    this.domNode = document.createElement('div');
    this.domNode.className = 'editor-pane';
    this.domNode.tabIndex = 1;
    
    parentElem.appendChild(this.domNode);

    const sharedViewSettings = getSharedViewSettings(document.body);

    this.charWidth = sharedViewSettings.charWidth;
    this.charHeight = sharedViewSettings.charHeight;

    this.gutterView = new GutterView(this.domNode, sharedViewSettings);
    this.bufferView = new BufferView(this.domNode, sharedViewSettings);
    this.cursorView = new CursorView(this.domNode, sharedViewSettings);

    this._initComponents();
    this._initEventListeners();
}

EditorPane.prototype._initComponents = function() {

    this.cursorView.setLeftOffset(this.gutterView.getWidth());

    this.bufferView.setLeftOffset(this.gutterView.getWidth()); 
    this.bufferView.setClientHeight(this.domNode.clientHeight);
    this.bufferView.setClientWidth(this.domNode.clientWidth);
};

EditorPane.prototype._initEventListeners = function() {

    this.gutterView.onWidthChanged((width) => {
        this.cursorView.setLeftOffset(width);
        this.bufferView.setLeftOffset(width); 
    });

    this.domNode.addEventListener('scroll', (e) => {
        this.bufferView.setScrollTop(this.domNode.scrollTop);
        this.bufferView.setScrollLeft(this.domNode.scrollLeft);
        this.gutterView.setLeftOffset(this.domNode.scrollLeft);
    });

    this.windowElem.addEventListener('resize', (e) => {
        
        // TODO: Use requestAnimationFrame().
        this.bufferView.setClientHeight(this.domNode.clientHeight);
        this.bufferView.setClientWidth(this.domNode.clientWidth);
        this.gutterView.setLeftOffset(this.domNode.scrollLeft);
    });
    
    this.bufferView.domNode.addEventListener('mousedown', (e) => {
        const pos = this.bufferView.clickToBufferPos(e.clientX, e.clientY);
        if (pos) {
            this.cursorView.moveTo(pos[1], pos[0]);
            this.gutterView.setActiveLine(this.cursorView.line);
        }
    });

};

EditorPane.prototype.insertText = function(text) {
    const line = this.bufferView.getLine(this.cursorView.line);
    const beforeInsert = line.slice(0, this.cursorView.col - 1);
    const afterInsert = line.slice(this.cursorView.col - 1);
    this.bufferView.setLine(this.cursorView.line, beforeInsert + text + afterInsert);
    this.cursorView.moveRight(text.length);

    this.checkScrollCursorIntoView();
};

EditorPane.prototype.insertNewLine = function() {
    const line = this.bufferView.getLine(this.cursorView.line);
    const toRemain = line.substr(0, this.cursorView.col - 1);
    const toGo = line.substr(this.cursorView.col - 1);

    this.bufferView.setLine(this.cursorView.line, toRemain);
    this.bufferView.insertLine(this.cursorView.line + 1, toGo);
    this.cursorView.moveTo(this.cursorView.line + 1, 1);
    this.gutterView.appendLine();
    this.gutterView.setActiveLine(this.cursorView.line);

    this.checkScrollCursorIntoView();
};

EditorPane.prototype.deleteBackChar = function() {
    if (this.cursorView.col === 1) {
        if (this.cursorView.line === 1) {
            return;
        }
        
        const prevLine = this.bufferView.getLine(this.cursorView.line - 1);
        this.bufferView.setLine(this.cursorView.line - 1,
                                prevLine + this.bufferView.getLine(this.cursorView.line));
        this.bufferView.removeLine(this.cursorView.line);
        this.cursorView.moveTo(this.cursorView.line - 1, prevLine.length + 1);
        this.gutterView.setActiveLine(this.cursorView.line);
        this.gutterView.removeLine();
    } else {
        const line = this.bufferView.getLine(this.cursorView.line);
        const beforeDelete = line.slice(0, this.cursorView.col - 2);
        const afterDelete = line.slice(this.cursorView.col - 1);
        this.bufferView.setLine(this.cursorView.line, beforeDelete + afterDelete);
        this.cursorView.moveLeft();
    }

     this.checkScrollCursorIntoView();
};

EditorPane.prototype.deleteForwardChar = function() {
    if (this.cursorView.col === this.bufferView.getLineWidthCols(this.cursorView.line) + 1) {
        if (this.cursorView.line < this.bufferView.getLastLineNum()) {
            const nextLine = this.bufferView.getLine(this.cursorView.line + 1);
            this.bufferView.removeLine(this.cursorView.line + 1);
            this.bufferView.setLine(this.cursorView.line, this.bufferView.getLine(this.cursorView.line) + nextLine);
        }
    } else {
        const line = this.bufferView.getLine(this.cursorView.line);
        this.bufferView.setLine(this.cursorView.line,
                                line.slice(0, this.cursorView.col - 1) +
                                line.slice(this.cursorView.col));
    }
};

EditorPane.prototype.killLine = function() {
    if (this.cursorView.col === this.bufferView.getLineWidthCols(this.cursorView.line) + 1) {
         if (this.cursorView.line < this.bufferView.getLastLineNum()) {
             const nextLine = this.bufferView.getLine(this.cursorView.line + 1);
             this.bufferView.removeLine(this.cursorView.line + 1);
             this.bufferView.setLine(this.cursorView.line, this.bufferView.getLine(this.cursorView.line) + nextLine);
             this.gutterView.removeLine();
        }
    } else {
        const lineUpToPoint = this.bufferView.getLine(this.cursorView.line).slice(0, this.cursorView.col - 1);
        this.bufferView.setLine(this.cursorView.line, lineUpToPoint);
    }
};

EditorPane.prototype.moveCursorLeft = function() {
    if (this.cursorView.col === 1) {
        if (this.cursorView.line !== 1) {
            const endOfPrevLine = this.bufferView.getLineWidthCols(this.cursorView.line - 1) + 1;
            this.cursorView.moveTo(this.cursorView.line - 1, endOfPrevLine);
            this.gutterView.setActiveLine(this.cursorView.line);

            this.checkScrollCursorIntoView();
        }
    } else {
        this.cursorView.moveLeft();

        this.checkScrollCursorIntoView();
    }
};

EditorPane.prototype.moveCursorRight = function() {
    if (this.cursorView.col === this.bufferView.getLineWidthCols(this.cursorView.line) + 1) {
        if (this.cursorView.line !== this.bufferView.getLastLineNum()) {
            this.cursorView.moveTo(this.cursorView.line + 1, 1);
            this.gutterView.setActiveLine(this.cursorView.line);

            this.checkScrollCursorIntoView();
        }
    } else {
        this.cursorView.moveRight();
        
        this.checkScrollCursorIntoView();
    }
};

EditorPane.prototype.moveCursorUp = function() {
    if (this.cursorView.line > 1) {
        this.cursorView.moveUp();
        this.gutterView.setActiveLine(this.cursorView.line);
        const lineWidth = this.bufferView.getLineWidthCols(this.cursorView.line);
        if (this.cursorView.col > lineWidth + 1) {
            this.cursorView.setCol(lineWidth + 1);
        }

        this.checkScrollCursorIntoView();
    }    
};

EditorPane.prototype.moveCursorDown = function() {
    if (this.cursorView.line < this.bufferView.getLastLineNum()) {
        this.cursorView.moveDown();
        this.gutterView.setActiveLine(this.cursorView.line);
        const lineWidth = this.bufferView.getLineWidthCols(this.cursorView.line);
        if (this.cursorView.col > lineWidth + 1) {
            this.cursorView.setCol(lineWidth + 1);
        }

        this.checkScrollCursorIntoView();
    }
};

EditorPane.prototype.moveCursorBeginningOfLine = function() {
    this.cursorView.setCol(1);
    this.cursorView.goalCol = this.cursorView.col;

    this.checkScrollCursorIntoView();
};

EditorPane.prototype.moveCursorEndOfLine = function() {
    this.cursorView.setCol(this.bufferView.getLineWidthCols(this.cursorView.line) + 1);
    this.cursorView.goalCol = this.cursorView.col;

    this.checkScrollCursorIntoView();
};

EditorPane.prototype.moveCursorTo = function(line, col) {
    if (line >= 1 && line <= this.bufferView.getLastLineNum() &&
        col >= 1 && col <= this.bufferView.getLineWidthCols(line) + 1) {
        this.cursorView.moveTo(line, col);
        this.gutterView.setActiveLine(this.cursorView.line);
        this.checkScrollCursorIntoView();
        return true;
    }
    return false;
};

// Sets the given line as the first visible.
EditorPane.prototype.scrollToLine = function(line) {
    const scrollTop = (line - 1) * this.charHeight;
    this.domNode.scrollTop = scrollTop;
    this.bufferView.setScrollTop(scrollTop);

    // TODO: It would be nice to ensure bufferView set its own height
    // correctly, be it in the css or programatically.
    if (this.bufferView.getHeight() < this.getHeight()) {
        this.bufferView.setHeight(this.getHeight());
    }
};

// Sets the given column as the first visible. 
EditorPane.prototype.scrollToCol = function(col) {
    const scrollLeft = (col - 1) * this.charWidth;
    this.domNode.scrollLeft = scrollLeft;
    this.bufferView.setScrollLeft(scrollLeft);
    this.gutterView.setLeftOffset(scrollLeft);

    // TODO: Would be nice if bufferView set its own width. See above.
    if (this.bufferView.getWidth() < this.getWidth()) {
        this.bufferView.setWidth(this.getWidth());
    }
};

EditorPane.prototype.checkScrollCursorIntoView = function() {
    if (this.cursorView.col < this.bufferView.getFirstVisibleCol()) {
        const firstVisible = Math.max(1, this.cursorView.col - 10);
        this.scrollToCol(firstVisible);    
    } else if (this.cursorView.col > this.bufferView.getLastVisibleCol()) {
        const lastVisible = Math.min(this.cursorView.col + 10, this.bufferView.getLastColNum());
        const firstVisible = lastVisible - this.bufferView.getVisibleWidthCols() + 1;
        this.scrollToCol(firstVisible);
    }

    if (this.cursorView.line < this.bufferView.getFirstVisibleLineNum()) {
        const firstVisible = Math.max(1, this.cursorView.line - 10);
        this.scrollToLine(firstVisible); 
    } else if (this.cursorView.line > this.bufferView.getLastVisibleLineNum()) {
        const lastVisible = Math.min(this.cursorView.line + 10, this.bufferView.getLastLineNum());
        const firstVisible = lastVisible - this.bufferView.getVisibleHeightLines() + 1;
        this.scrollToLine(firstVisible);
    }
};

EditorPane.prototype.setFocused = function() {
    this.domNode.focus();
};

EditorPane.prototype.setCursorBlink = function(on) {
    this.cursorView.setBlink(on);
};

EditorPane.prototype.setTopOffset = function(to) {
    this.domNode.style.top = to + 'px';
};

EditorPane.prototype.setHeight = function(to) {
    this.domNode.style.height = to + 'px';
};

EditorPane.prototype.getHeight = function() {
    const height = parseInt(this.domNode.style.height) || this.domNode.scrollHeight;
    if (!height) {
        throw new Error('EditorPane: Unable to parse height.');
    }
    return height;
};

EditorPane.prototype.getWidth = function() {
    const width = parseInt(this.domNode.style.width) || this.domNode.scrollWidth;
    if (!width) {
        throw new Error('EditorPane: Unable to parse width.');
    }
    return width;
};

module.exports.EditorPane = EditorPane;
