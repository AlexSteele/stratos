'use strict';

const {EventEmitter} = require('events');

const defaultSettings = {
    charWidth: 10,
    charHeight: 20,
    maxColumns: 120,
    leftOffset: 0
};

function BufferView(parentElem, config = defaultSettings) {

    this.lineElems = [null];
    this.charWidth = config.charWidth || defaultSettings.charWidth; // pixels
    this.charHeight = config.charHeight || defaultSettings.charHeight; //pixels
    this.maxColumns = config.maxColumns || defaultSettings.maxColumns; // Max columns at current width.

    this.clientHeight = 0;
    this.scrollTop = 0; 
    this.leftOffset = config.leftOffset || defaultSettings.leftOffset;

    this.domNode = document.createElement('div');
    this.domNode.className = 'buffer';
    this.domNode.style.left = this.leftOffset + 'px';

    parentElem.appendChild(this.domNode);

    // Start with empty line.
    this.appendLine('');
}

BufferView.prototype.appendLine = function(text) {
    this.insertLine(this.lineElems.length, text);
};

BufferView.prototype.setLine = function(num, text) {
    if (num < 1 || num >= this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num);
    }

    if (text.length > this.maxColumns) {
        this.maxColumns += 10;
        this.domNode.style.width = this.getColumnsWidth() + 'px'; 
    }
    
    const line = this.lineElems[num];
    line.innerHTML = text; 
};

BufferView.prototype.insertLine = function(num, text) {
    if (num < 1 || num > this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num); 
    }

    if (text.length >= this.maxColumns) {
        this.maxColumns++;
        this.domNode.style.width = this.getColumnsWidth() + 'px';
    }

    if (this.getHeightOfLines() + this.charHeight > this.getHeight()) {
        this.setHeight((this.getHeight() + this.charHeight) + 'px');
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

BufferView.prototype.getLastLineNum = function() {
    return this.lineElems.length - 1;
};

BufferView.prototype.getColumnsWidthPix = function() {
    return this.maxColumns * this.charWidth;
};

BufferView.prototype.getLinesHeightPix = function() {
    return this.maxLines * this.charHeight;
};

BufferView.prototype.getHeightOfLines = function() {
    return Math.round(this.getLastLineNum() * this.charHeight);
};

BufferView.prototype.getLineWidthChars = function(lineNum) {
    if (lineNum < 1 || lineNum >= this.lineElems.length) {
        throw new Error('BufferVi<ew: No line with number ' + lineNum);
    }

    return this.lineElems[lineNum].innerHTML.length;
};

// TODO: Implement correctly.
BufferView.prototype.getFirstVisibleCol = function() {
    return 1;
};

// TODO: Implement correctly.
BufferView.prototype.getLastVisibleCol = function(row) {
    if (row) {
        return this.getLineWidthChars(row) + 1;
    }
    return 9999;
};

BufferView.prototype.getFirstVisibleLineNum = function() {
    return Math.round(+this.scrollTop / this.charHeight) + 1;
};

BufferView.prototype.getLastVisibleLineNum = function() {
    const lastOnScreen = Math.round(+this.clientHeight / this.charHeight) + this.getFirstVisibleLineNum() - 1;
    const lastLineNum = this.getLastLineNum();
    return Math.min(lastOnScreen, lastLineNum);
};

// TODO: This is kind of a hack to make calculating first visible line possible.
BufferView.prototype.setScrollTop = function(num) {
    this.scrollTop = num;
};

BufferView.prototype.setHeight = function(num) {
    this.domNode.style.height = num;
};

BufferView.prototype.getHeight = function() {
    const height = parseInt(this.domNode.style.height) || parseInt(this.domNode.scrollHeight);
    if (!height) {
        throw new Error('BufferView: Unable to parse height.');
    }
    return height;
};

// This function is merely for record keeping.
// It has no side-effects on the DOM.
BufferView.prototype.setClientHeight = function(num) {
    this.clientHeight = num;
};

BufferView.prototype.setLeftOffset = function(width) {
    this.leftOffset = width;
    this.domNode.style.left = width + 'px';
};

// Returns an [x, y] tuple or null if the position is not in bounds.
BufferView.prototype.clickPosToBufferPos = function(x, y) {
    const adjustedX = x - this.leftOffset;
    const buffX = Math.round(adjustedX / this.charWidth) + 1;
    const buffY = Math.round(y / this.charHeight) + this.getFirstVisibleLineNum();

    if (buffY >= this.getFirstVisibleLineNum() && buffY <= this.getLastVisibleLineNum() &&
        buffX >= this.getFirstVisibleCol())
    {
        const lastCol = this.getLastVisibleCol(buffY);
        return buffX <= lastCol ?
            [buffX, buffY] :
            [lastCol, buffY];
    }

    return null; 
};

module.exports.BufferView = BufferView; 
