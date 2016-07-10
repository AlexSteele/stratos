'use strict';

const {EventEmitter} = require('events');

const defaultSettings = {
    charWidth: 10,
    charHeight: 20,
    pad: 8
};

function GutterView(parentElem, config = defaultSettings) {

    this.emitter = new EventEmitter(); 

    this.activeLineElem = null;
    this.lineElems = [null];
    this.lastLineNumDigits = 1; // The number of digits in the last line's number.

    this.charWidth = config.charWidth || defaultSettings.charWidth;
    this.charHeight = config.charHeight || defaultSettings.charHeight;
    this.pad = config.pad || defaultSettings.pad;
    
    this.domNode = document.createElement('div');
    parentElem.appendChild(this.domNode);
    this.domNode.className = 'gutter';
    this.domNode.style.width = this.getWidth() + 'px';

    // Start with one line.
    this.appendLine();
    this.setActiveLine(1);
}

GutterView.prototype.appendLine = function() {
    const line = document.createElement('span');
    line.className = 'gutter-line';
    line.innerHTML = this.lineElems.length;

    this.lineElems.push(line);
    this.domNode.appendChild(line);

    this._checkUpdateWidth();
    this._checkUpdateHeight();
};

GutterView.prototype.removeLine = function() {
    if (this.lineElems.length < 2) {
        throw new Error('GutterView: No line to remove.');
    }
    
    const removed = this.lineElems.splice(this.lineElems.length - 1, 1)[0];
    this.domNode.removeChild(removed);
    
    this._checkUpdateWidth();
    this._checkUpdateHeight();
};

GutterView.prototype.setActiveLine = function(num) {
    const line = this.lineElems[num];
    if (!line) {
        throw new Error('GutterView: No line with number ' + num); 
    }
    if (this.activeLineElem) {
        this.activeLineElem.className = 'gutter-line'; 
    }
    line.className = 'gutter-line-active';
    this.activeLineElem = line; 
};

GutterView.prototype.getLastLineNum = function() {
    return this.lineElems.length - 1;
};

GutterView.prototype.getWidth = function() {
    return (this.lastLineNumDigits * this.charWidth) + this.pad;
};

GutterView.prototype.getHeightOfLines = function() {
    return Math.round(this.getLastLineNum() * this.charHeight);
};

GutterView.prototype.setScrollTop = function(num) {
    this.domNode.scrollTop = num;
};

GutterView.prototype.getHeight = function() {
    const height = parseInt(this.domNode.style.height) || parseInt(this.domNode.scrollHeight);
    if (!height) {
        throw new Error('GutterView: Unable to parse height.');
    }
    return height;
};

GutterView.prototype.setHeight = function(num) {
    this.domNode.style.height = num + 'px';
};

GutterView.prototype.setLeftOffset = function(num) {
    this.domNode.style.left = num + 'px';
};

GutterView.prototype.onWidthChanged = function(callback) {
    this.emitter.on('width-changed', callback); 
};

GutterView.prototype._checkUpdateWidth = function() {

    // TODO: Brute forcing this under assumption that
    //             1) efficiency gains are worthwhile and
    //             2) the number of lines in a file won't exceed 100000 :)
    
    const lastLineNum = this.getLastLineNum();
    
    let actualLastLineNumDigits;
    if (lastLineNum < 10) {
        actualLastLineNumDigits = 1;
    } else if (lastLineNum < 100) {
        actualLastLineNumDigits = 2;
    } else if (lastLineNum < 1000) {
        actualLastLineNumDigits = 3;
    } else if (lastLineNum < 10000) {
        actualLastLineNumDigits = 4;
    } else if (lastLineNum < 100000) {
        actualLastLineNumDigits = 5;
    } else {
        throw new Error("GutterView: Way too many lines! Can't set gutter width.");
    }

    if (actualLastLineNumDigits != this.lastLineNumDigits) {
        this.lastLineNumDigits = actualLastLineNumDigits;
        const width = this.getWidth();
        this.domNode.style.width = width + 'px';
        this.emitter.emit('width-changed', width);
    }
};

GutterView.prototype._checkUpdateHeight = function() {
    if (this.getHeightOfLines() != this.getHeight()) {
        this.setHeight(this.getHeightOfLines());
    }
};

module.exports.GutterView = GutterView;
