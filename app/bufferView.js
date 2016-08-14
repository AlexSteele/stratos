'use strict';

const LineRange = require('./lineRange.js');

const defaults = {
    charWidth: 0,  // pixels
    charHeight: 0, // pixels
    onClick: (line, col) => { throw new Error('BufferView: No handler for onClick.'); }
};

function BufferView(parentElem, settings = defaults) {

    this.domNode = document.createElement('div');
    this.domNode.className = 'buffer';
    parentElem.appendChild(this.domNode);

    this.lineElems = [];
    this.selectionRange = new LineRange();
    this.onClick = settings.onClick || defaults.onClick;

    this.charWidth = settings.charWidth || defaults.charWidth;
    this.charHeight = settings.charHeight || defaults.charHeight;
    this.visibleHeight = this.domNode.clientHeight;
    this.visibleWidth = this.domNode.clientWidth;
    this.scrollTop = this.domNode.scrollTop;
    this.scrollLeft = this.domNode.scrollLeft;
}

BufferView.prototype.appendLine = function(text = '') {
    this.insertLine(this.lineElems.length, text);
};

BufferView.prototype.insertLine = function(num, text) {
    if (num < 0 || num > this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num); 
    }

    const domNode = document.createElement('div');
    domNode.className = 'line';
    domNode.style.height = this.charHeight + 'px';
    const textNode = document.createElement('span');
    textNode.innerHTML = text;
    domNode.appendChild(textNode);

    const line = {
        domNode,
        textNode
    };

    if (num === this.lineElems.length) {
        this.domNode.appendChild(domNode);
    } else {
        this.domNode.insertBefore(domNode, this.lineElems[num].domNode);         
    }
    this.lineElems.splice(num, 0, line);
};

BufferView.prototype.setLine = function(num, text) {
    if (num < 0 || num >= this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num);
    }
    
    const line = this.lineElems[num];
    line.textNode.innerHTML = text;
};

BufferView.prototype.removeLine = function(num) {
    if (num < 0 || num >= this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num); 
    }

    const removed = this.lineElems.splice(num, 1)[0];
    this.domNode.removeChild(removed.domNode); 
};

BufferView.prototype.setSelectionRange = function(startLine, startCol, endLine, endCol) {
    if (this.hasSelection()) {
        
        // Remove the boundary highlights from the existing range...
        this._removeSelectionHighlight(this.selectionRange.startLine);
        if (this.selectionRange.spansMultipleLines()) {
            this._removeSelectionHighlight(this.selectionRange.endLine);
        }
        
        // ...and the non-overlapping ones.
        for (let i = this.selectionRange.startLine + 1;
             i <= startLine && i < this.selectionRange.endLine; i++) {
            this._removeSelectionHighlight(i);
        }
        for (let i = this.selectionRange.endLine - 1;
             i >= endLine && i > this.selectionRange.startLine; i--) {
            this._removeSelectionHighlight(i);
        }
    }

    // Add the boundary highlights from the new range.
    if (startLine === endLine) {
        this._addSelectionHighlight(startLine, startCol, endCol);
    } else {
        this._addSelectionHighlight(startLine, startCol);
        this._addSelectionHighlight(endLine, 0, endCol);    
    }

    // ... and the non-overlapping ones.
    for (let i = startLine + 1;
         i < endLine && i <= this.selectionRange.startLine; i++) {
        this._addSelectionHighlight(i);
    }
    for (let i = endLine - 1;
         i > startLine && i >= this.selectionRange.endLine; i--) {
        this._addSelectionHighlight(i);
    }
    this.selectionRange.setTo(startLine, startCol, endLine, endCol);
};

BufferView.prototype.getSelectionRange = function() {
    return this.selectionRange;
};

BufferView.prototype.hasSelection = function() {
    return !this.selectionRange.isEmpty(); 
};

BufferView.prototype.clearSelection = function() {
    if (this.selectionRange.isEmpty()) return;

    const {startLine, startCol, endLine, endCol} = this.selectionRange.splat();
    for (let i = startLine; i <= endLine; i++) {
        this._removeSelectionHighlight(i);
    }
    this.selectionRange.clear();
};

// colEnd is not included in the highlighted range.
BufferView.prototype._addSelectionHighlight = function(lineNum, colStart, colEnd) {
    const line = this.lineElems[lineNum];
    const start = colStart || 0;
    const end = colEnd || line.textNode.textContent.length;
    const node = document.createElement('div');
    node.className = 'line-decoration selection';
    node.style.left = start * this.charWidth;
    node.style.width = (end - start) * this.charWidth;
    node.style.height = this.charHeight;
    line.selectionNode = node;
    line.domNode.appendChild(node);
};

BufferView.prototype._removeSelectionHighlight = function(lineNum) {
    const line = this.lineElems[lineNum];
    line.domNode.removeChild(line.selectionNode);
    delete line.selectionNode;
};

// This function is merely for record keeping.
// It has no side-effects on the DOM.
BufferView.prototype.setVisibleHeight = function(to) {
    this.visibleHeight = to;
};

BufferView.prototype.getVisibleHeightLines = function() {
    return Math.round(this.visibleHeight / this.charHeight);
};

BufferView.prototype.getFirstVisibleLineNum = function() {
    return Math.round(this.scrollTop / this.charHeight);
};

BufferView.prototype.getLastVisibleLineNum = function() {
    return this.getFirstVisibleLineNum() + this.getVisibleHeightLines() - 1;
};

BufferView.prototype.setLeftOffset = function(to) {
    this.domNode.style.left = to + 'px';
};

BufferView.prototype.getLeftOffset = function() {
    const offset = parseInt(this.domNode.style.left);
    if (offset == null) {
        throw new Error('BufferView: Unable to parse leftOffset.');
    }
    return offset;
};

BufferView.prototype.setVisibleWidth = function(to) {
    this.visibleWidth = to;
};

BufferView.prototype.getVisibleWidth = function() {
    return this.visibleWidth;
};

BufferView.prototype.getVisibleWidthCols = function() {
    return Math.round(this.getVisibleWidth() / this.charWidth);
};

BufferView.prototype.getFirstVisibleCol = function() {
    return Math.round(this.scrollLeft / this.charWidth);
};

BufferView.prototype.getLastVisibleCol = function() {
    return this.getFirstVisibleCol() + this.getVisibleWidthCols() - 1; 
};

BufferView.prototype.getLineWidthCols = function(lineNum) {
    if (lineNum < 0 || lineNum >= this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + lineNum);
    }

    return this.lineElems[lineNum].textNode.textContent.length;
};

BufferView.prototype.getWidthCols = function() {
    return Math.round(this.getWidth() / this.charWidth);
};

BufferView.prototype.getWidth = function() {
    return this.domNode.scrollWidth;
};

BufferView.prototype.getLastColNum = function() {
    return this.getWidthCols() - 1;
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

BufferView.prototype.getLastLineNum = function() {
    return this.lineElems.length - 1;
};

module.exports = BufferView; 
