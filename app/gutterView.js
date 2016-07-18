'use strict';

const {EventEmitter} = require('events');
const {numDigitsIn} = require('./utils.js');

const defaults = {
    charWidth: 10,
    charHeight: 20,
    pad: 8
};

function GutterView(parentElem, settings = defaults) {

    this.emitter = new EventEmitter(); 

    this.activeLineElem = null;
    this.lineElems = [null];
    this.lastLineNumDigits = 1; // The number of digits in the last line's number.

    this.charWidth = settings.charWidth || defaults.charWidth;
    this.charHeight = settings.charHeight || defaults.charHeight;
    this.pad = settings.pad || defaults.pad;
    
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

    const actualLastLineNumDigits = numDigitsIn(this.getLastLineNum());

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
