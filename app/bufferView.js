'use strict';

const defaults = {
    charWidth: 0,  // pixels
    charHeight: 0, // pixels
    onClick: (line, col) => { throw new Error('BufferView: No handler for onClick.'); }
};

function BufferView(parentElem, settings = defaults) {

    this.domNode = document.createElement('div');
    this.domNode.className = 'buffer';
    parentElem.appendChild(this.domNode);

    this.lineElems = [null];
    this.activeSelectionRange = null;
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
    if (num < 1 || num > this.lineElems.length) {
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
    if (num < 1 || num >= this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num);
    }
    
    const line = this.lineElems[num];
    line.textNode.innerHTML = text;
};

BufferView.prototype.removeLine = function(num) {
    if (num < 1 || num >= this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num); 
    }

    const removed = this.lineElems.splice(num, 1)[0];
    this.domNode.removeChild(removed.domNode); 
};

BufferView.prototype.setActiveSelectionRange = function(range) {
    this.clearActiveSelection();
    this.activeSelectionRange = range;
    if (range.start[0] === range.end[0]) {
        this._addLineSelection(range.start[0], {
            className: 'selection',
            start: range.start[1],
            end: range.end[1]
        });
    } else {
        this._addLineSelection(range.start[0], {className: 'selection', start: range.start[1]});
        for (let i = range.start[0] + 1; i < range.end[0]; i++) {
            this._addLineSelection(i, {className: 'selection'});
        }
        this._addLineSelection(range.end[0], {className: 'selection', end: range.end[1]});    
    }    
};

BufferView.prototype.clearActiveSelection = function() {
    if (!this.activeSelectionRange) return;

    const {start, end} = this.activeSelectionRange;
    this.lineElems.slice(start[0], end[0] + 1).forEach(e => {
        e.domNode.removeChild(e.selectionNode);
        console.log('removed!');
        delete e.selectionNode;
    });
    this.activeSelectionRange = null;
};

BufferView.prototype._addLineSelection = function(lineNum, decoration) {
    const line = this.lineElems[lineNum];
    const start = decoration.start || 0;
    const end = decoration.end || line.textNode.textContent.length + 1;
    const node = document.createElement('div');
    node.className = 'line-decoration ' + decoration.className;
    node.style.left = (start - 1) * this.charWidth;
    node.style.width = (end - start) * this.charWidth;
    node.style.height = this.charHeight;
    line.selectionNode = node;
    line.domNode.appendChild(node);
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
    return Math.round(this.scrollTop / this.charHeight) + 1;
};

BufferView.prototype.getLastVisibleLineNum = function() {
    const lastOnScreen = this.getFirstVisibleLineNum() + this.getVisibleHeightLines() - 1;
    const lastLineNum = this.getLastLineNum();
    return Math.min(lastOnScreen, lastLineNum);
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
    return Math.round(this.scrollLeft / this.charWidth) + 1;
};

BufferView.prototype.getLastVisibleCol = function() {
    return this.getFirstVisibleCol() + this.getVisibleWidthCols() - 1; 
};

BufferView.prototype.getLineWidthCols = function(lineNum) {
    if (lineNum < 1 || lineNum >= this.lineElems.length) {
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
    return this.getWidthCols();
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
