'use strict';

const defaults = {
    charWidth: 10,
    charHeight: 20,
    onClick: (pos) => { throw new Error('BufferView: No handler for onClick.'); }
};

function BufferView(parentElem, settings = defaults) {

    this.domNode = document.createElement('div');
    this.domNode.className = 'buffer';
    parentElem.appendChild(this.domNode);

    this.lineElems = [null];
    this.charWidth = settings.charWidth || defaults.charWidth; // pixels
    this.charHeight = settings.charHeight || defaults.charHeight; //pixels
    this.onClick = settings.onClick || defaults.onClick;

    this.visibleHeight = this.domNode.clientHeight;
    this.visibleWidth = this.domNode.clientWidth;
    this.scrollTop = this.domNode.scrollTop;
    this.scrollLeft = this.domNode.scrollLeft;

    this._initEventListeners();

    // Start with empty line.
    this.appendLine('');
}

BufferView.prototype._initEventListeners = function() {
    this.domNode.addEventListener('mousedown', (e) => {
        const pos = this._clickToBufferPos(e.clientX, e.clientY);
        if (pos) {
            this.onClick(pos);
        }
        e.preventDefault();
    });
};

BufferView.prototype.appendLine = function(text) {
    this.insertLine(this.lineElems.length, text);
};

BufferView.prototype.insertLine = function(num, text) {
    if (num < 1 || num > this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num); 
    }

    const line = document.createElement('span');
    line.className = 'line';
    line.style.height = this.charHeight;
    line.innerHTML = text;

    this.lineElems.splice(num, 0, line);
    if (num == this.lineElems.length) {
        this.domNode.appendChild(line);
    } else {
        this.domNode.insertBefore(line, this.lineElems[num + 1]);         
    }
};

BufferView.prototype.setLine = function(num, text) {
    if (num < 1 || num >= this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num);
    }
    
    const line = this.lineElems[num];
    line.innerHTML = text; 
};

BufferView.prototype.removeLine = function(num) {
    if (num < 1 || num >= this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num); 
    }

    const removed = this.lineElems.splice(num, 1)[0];
    this.domNode.removeChild(removed); 
};

BufferView.prototype.getLine = function(num) {
    if (num < 1 || num >= this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num); 
    }

    return this.lineElems[num].innerHTML;
};

// This function is merely for record keeping.
// It has no side-effects on the DOM.
BufferView.prototype.setVisibleHeight = function(to) {
    this.visibleHeight = to;
};

BufferView.prototype.setLeftOffset = function(to) {
    this.domNode.style.left = to + 'px';
};

BufferView.prototype.setVisibleWidth = function(to) {
    this.visibleWidth = to;
};

BufferView.prototype.setScrollTop = function(to) {
    this.scrollTop = to;
};

BufferView.prototype.setScrollLeft = function(to) {
    this.scrollLeft = to;
};

BufferView.prototype.getHeight = function() {
    const height = parseInt(this.domNode.style.height) || this.domNode.scrollHeight;
    if (height == null) {
        throw new Error('BufferView: Unable to parse height.');
    }
    return height;
};

BufferView.prototype.getHeightOfLines = function() {
    return Math.round(this.getLastLineNum() * this.charHeight);
};

BufferView.prototype.getLastLineNum = function() {
    return this.lineElems.length - 1;
};

BufferView.prototype.getVisibleHeightLines = function() {
    return Math.round(this.visibleHeight / this.charHeight);
};

BufferView.prototype.getFirstVisibleLineNum = function() {
    return Math.round(this.scrollTop / this.charHeight) + 1;
};

BufferView.prototype.getLastVisibleLineNum = function() {
    const lastOnScreen = this.getFirstVisibleLineNum() + this.getVisibleHeightLines() - 1;
    const lastLineNum = this.getLastLineNum();
    return Math.min(lastOnScreen, lastLineNum);
};

BufferView.prototype.getLeftOffset = function() {
    const offset = parseInt(this.domNode.style.left);
    if (offset == null) {
        throw new Error('BufferView: Unable to parse leftOffset.');
    }
    return offset;
};

BufferView.prototype.getWidth = function() {
    return this.domNode.scrollWidth;
};

BufferView.prototype.getWidthCols = function() {
    return Math.round(this.getWidth() / this.charWidth);
};

BufferView.prototype.getLastColNum = function() {
    return this.getWidthCols();
};

BufferView.prototype.getVisibleWidth = function() {
    return this.visibleWidth;
};

BufferView.prototype.getVisibleWidthCols = function() {
    return Math.round(this.getVisibleWidth() / this.charWidth);
};

BufferView.prototype.getFirstVisibleCol = function() {
    return Math.round(this.scrollLeft / this.charWidth) + 1;
};

BufferView.prototype.getLastVisibleCol = function() {
    return this.getFirstVisibleCol() + this.getVisibleWidthCols() - 1; 
};

BufferView.prototype.getLineWidthCols = function(lineNum) {
    if (lineNum < 1 || lineNum >= this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + lineNum);
    }

    return this.lineElems[lineNum].innerHTML.length;
};

// Returns a [line, col] tuple, or null if the given coordinates'
// y position is greater than the last line of this buffer.
// If the given coordinates' corresponding column is greater than the
// width of their corresponding line, returns the width of the line + 1.
BufferView.prototype._clickToBufferPos = function(x, y) {
    const bounds = this.domNode.getBoundingClientRect();

    const adjustedY = y - bounds.top;
    const line = Math.floor(adjustedY / this.charHeight) + 1;
    const lastLine = this.getLastLineNum();

    if (line > lastLine) return null;

    const adjustedX = x - bounds.left;
    const col = Math.round(adjustedX / this.charWidth) + 1;
    const lastCol = this.getLineWidthCols(line) + 1;
    const clickCol = Math.min(col, lastCol);
    
    return [line, clickCol];
};

module.exports.BufferView = BufferView; 
