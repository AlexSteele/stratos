'use strict';

const defaultSettings = {
    charWidth: 10,
    charHeight: 20,
    maxColumns: 120,
    maxRows: 50,
    leftOffset: 0
};

function BufferView(rootElem, config = defaultSettings) {

    this.lineElems = [null];
    this.charWidth = config.charWidth || defaultSettings.charWidth; // pixels
    this.charHeight = config.charHeight || defaultSettings.charHeight; //pixels
    this.maxColumns = config.maxColumns || defaultSettings.maxColumns;
    this.maxRows = config.maxRows || defaultSettings.maxRows;

    this.domNode = document.createElement('div');
    this.domNode.className = 'buffer';
    this.domNode.style.left = (config.leftOffset || defaultSettings.leftOffset) + 'px';

    // Start with empty line.
    this.appendLine('');

    rootElem.appendChild(this.domNode);
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
        this.domNode.style.width = this.getWidth() + 'px'; 
    }
    
    const line = this.lineElems[num];
    line.innerHTML = text; 
};

BufferView.prototype.insertLine = function(num, text) {
    if (num < 1 || num > this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num); 
    }

    if (text.length > this.maxColumns) {
        this.maxColumns += 10;
        this.domNode.style.width = this.getWidth() + 'px';
    }
    
    if (this.lastRowNum() >= this.maxRows) {
        this.maxRows++;
        this.domNode.style.height = this.getHeight() + 'px';
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

BufferView.prototype.lastRowNum = function() {
    return this.lineElems.length - 1;
};

BufferView.prototype.setLeftOffset = function(width) {
    this.domNode.style.left = width + 'px';
};

BufferView.prototype.getWidth = function() {
    return this.maxColumns * this.charWidth;
};

BufferView.prototype.getHeight = function() {
    return this.maxRows * this.charHeight;
};

BufferView.prototype.getLineWidthChars = function(num) {
    if (num < 1 || num >= this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num);
    }

    return this.lineElems[num].innerHTML.length;
};

BufferView.prototype.firstVisibleRowNum = function() {
    return (this.domNode.scrollTop / this.charHeight) + 1;
};

BufferView.prototype.lastVisibleRowNum = function() {
    return (this.domNode.scrollHeight / this.charHeight) + this.firstVisibleRowNum() - 1;
};

BufferView.prototype.scrollDownRow = function(delta) {
    const amount = delta || 1;
    this.domNode.scrollTop = +this.domNode.scrollTop + (this.charHeight * amount);
};

BufferView.prototype.scrollUpRow = function(delta) {
    const amount = delta || 1;
    this.domNode.scrollTop = +this.domNode.scrollTop - (this.charHeight * amount); 
};

module.exports.BufferView = BufferView; 
