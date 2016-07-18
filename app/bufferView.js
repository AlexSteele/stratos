'use strict';

const defaults = {
    charWidth: 10,
    charHeight: 20
};

function BufferView(parentElem, settings = defaults) {

    this.lineElems = [null];
    this.charWidth = settings.charWidth || defaults.charWidth; // pixels
    this.charHeight = settings.charHeight || defaults.charHeight; //pixels

    this.domNode = document.createElement('div');
    this.domNode.className = 'buffer';

    parentElem.appendChild(this.domNode);

    this.clientHeight = this.domNode.clientHeight;
    this.clientWidth = this.domNode.clientWidth;
    this.scrollTop = this.domNode.scrollTop;
    this.scrollLeft = this.domNode.scrollLeft;

    // Start with empty line.
    this.appendLine('');
}

BufferView.prototype.appendLine = function(text) {
    this.insertLine(this.lineElems.length, text);
};

BufferView.prototype.insertLine = function(num, text) {
    if (num < 1 || num > this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num); 
    }

    // if (text.length > this.getWidthCols()) {
    //     this.setWidth(text.length * this.charWidth);
    // }

    // if (this.getHeightOfLines() + this.charHeight > this.getHeight()) {
    //     this.setHeight(this.getHeight() + this.charHeight);
    // }

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

    // if (text.length > this.getWidthCols()) {
    //     this.setWidth(text.length * this.charWidth);
    // }
    
    const line = this.lineElems[num];
    line.innerHTML = text; 
};

BufferView.prototype.removeLine = function(num) {
    if (num < 1 || num >= this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num); 
    }

    // if (this.getHeightOfLines() < this.getHeight()) {
    //     this.setHeight(this.getHeightOfLines());
    // }
    
    const removed = this.lineElems.splice(num, 1)[0];
    this.domNode.removeChild(removed); 
};

BufferView.prototype.getLine = function(num) {
    if (num < 1 || num >= this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num); 
    }

    return this.lineElems[num].innerHTML;
};

BufferView.prototype.getHeight = function() {
    const height = parseInt(this.domNode.style.height) || this.domNode.scrollHeight;
    if (!height) {
        throw new Error('BufferView: Unable to parse height.');
    }
    return height;
};

BufferView.prototype.setHeight = function(num) {
    this.domNode.style.height = num + 'px';
};

// This function is merely for record keeping.
// It has no side-effects on the DOM.
BufferView.prototype.setClientHeight = function(num) {
    this.clientHeight = num;
};

BufferView.prototype.getHeightOfLines = function() {
    return Math.round(this.getLastLineNum() * this.charHeight);
};

BufferView.prototype.getLastLineNum = function() {
    return this.lineElems.length - 1;
};

BufferView.prototype.getVisibleHeightLines = function() {
    return Math.round(this.clientHeight / this.charHeight);
};

BufferView.prototype.getFirstVisibleLineNum = function() {
    return Math.round(this.scrollTop / this.charHeight) + 1;
};

BufferView.prototype.getLastVisibleLineNum = function() {
    const lastOnScreen = this.getFirstVisibleLineNum() + this.getVisibleHeightLines() - 1;
    const lastLineNum = this.getLastLineNum();
    return Math.min(lastOnScreen, lastLineNum);
};

BufferView.prototype.getWidth = function() {
    const width = parseInt(this.domNode.style.width) || this.domNode.scrollWidth;
    if (!width) {
        throw new Error('BufferView: Unable to parse width.');
    }
    return width;
};

BufferView.prototype.setWidth = function(num) {
    this.domNode.style.width = num + 'px';
};

BufferView.prototype.setClientWidth = function(width) {
    this.clientWidth = width;
};

BufferView.prototype.getWidthCols = function() {
    return Math.round(this.getWidth() / this.charWidth);
};

BufferView.prototype.getLastColNum = function() {
    return this.getWidthCols();
};

BufferView.prototype.getVisibleWidth = function() {
    return this.clientWidth; 
};

BufferView.prototype.getVisibleWidthCols = function() {
    return Math.round((this.getVisibleWidth() - this.getLeftOffset()) / this.charWidth);
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

BufferView.prototype.setScrollTop = function(num) {
    this.scrollTop = num;
};

BufferView.prototype.setScrollLeft = function(num) {
    this.scrollLeft = num;
};

BufferView.prototype.getLeftOffset = function() {
    const offset = parseInt(this.domNode.style.left);
    if (!offset) {
        throw new Error('BufferView: Unable to parse left offset.');
    }
    return offset;
};

BufferView.prototype.setLeftOffset = function(width) {
    this.domNode.style.left = width + 'px';
};

// Returns an [x, y] tuple or null if the position is not in bounds.
BufferView.prototype.clickToBufferPos = function(x, y) {
    const adjustedX = x - this.getLeftOffset();
    const buffX = Math.round(adjustedX / this.charWidth) + 1;
    const buffY = Math.round(y / this.charHeight) + this.getFirstVisibleLineNum();

    if (buffY >= this.getFirstVisibleLineNum() && buffY <= this.getLastVisibleLineNum() &&
        buffX >= this.getFirstVisibleCol())
    {
        const lastCol = this.getLineWidthCols(buffY) + 1;
        return buffX <= lastCol ?
            [buffX, buffY] :
            [lastCol, buffY];
    }

    return null; 
};

module.exports.BufferView = BufferView; 
