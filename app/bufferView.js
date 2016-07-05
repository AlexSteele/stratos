'use strict';

const {EventEmitter} = require('events');

const defaultSettings = {
    charWidth: 10,
    charHeight: 20,
    maxColumns: 120,
    maxLines: 50,
    leftOffset: 0
};

function BufferView(parentElem, config = defaultSettings) {

    this.emitter = new EventEmitter();

    this.lineElems = [null];
    this.charWidth = config.charWidth || defaultSettings.charWidth; // pixels
    this.charHeight = config.charHeight || defaultSettings.charHeight; //pixels
    this.maxColumns = config.maxColumns || defaultSettings.maxColumns;
    this.maxLines = config.maxLines || defaultSettings.maxLines;

    this.domNode = document.createElement('div');
    this.domNode.className = 'buffer';
    this.domNode.style.left = (config.leftOffset || defaultSettings.leftOffset) + 'px';

    this.domNode.addEventListener('scroll', (e) => this.emitter.emit('scroll', e));

    // Start with empty line.
    this.appendLine('');

    parentElem.appendChild(this.domNode);
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
        this.maxColumns += 10;
        this.domNode.style.width = this.getColumnsWidth() + 'px';
    }
    
    if (this.getLastLineNum() >= this.maxLines) {
        this.maxLines++;
        this.domNode.style.height = this.getLinesHeight() + 'px';
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

BufferView.prototype.getColumnsWidth = function() {
    return this.maxColumns * this.charWidth;
};

BufferView.prototype.getLinesHeight = function() {
    return this.maxLines * this.charHeight;
};

BufferView.prototype.getScrollTop = function() {
    return this.domNode.scrollTop;
};

BufferView.prototype.getLineWidthChars = function(lineNum) {
    if (lineNum < 1 || lineNum >= this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + lineNum);
    }

    return this.lineElems[lineNum].innerHTML.length;
};

BufferView.prototype.getLastLineNum = function() {
    return this.lineElems.length - 1;
};

BufferView.prototype.getFirstVisibleLineNum = function() {
    return Math.round(this.domNode.scrollTop / this.charHeight) + 1;
};

BufferView.prototype.getLastVisibleLineNum = function() {
    return Math.round(this.domNode.clientHeight / this.charHeight) + this.getFirstVisibleLineNum() - 1;
};

BufferView.prototype.setLeftOffset = function(width) {
    this.domNode.style.left = width + 'px';
};

// TODO: Ensure we don't scroll beyond first line or last line of buffer.

BufferView.prototype.scrollDownLine = function(delta) {
    const amount = delta || 1;
    this.domNode.scrollTop = +this.domNode.scrollTop + (this.charHeight * amount) + '';
};

BufferView.prototype.scrollUpLine = function(delta) {
    const amount = delta || 1;
    this.domNode.scrollTop = +this.domNode.scrollTop - (this.charHeight * amount) + '';
};

BufferView.prototype.onScroll = function(callback) {
    this.emitter.on('scroll', callback);
};

module.exports.BufferView = BufferView; 
