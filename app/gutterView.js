'use strict';

const {numDigitsIn} = require('./utils.js');

const defaults = {
    charWidth: 10,
    charHeight: 20,
    pad: 10,
    onWidthChanged: (width) => { throw new Error('GutterView: No handler for onWidthChanged'); }
};

function GutterView(parentElem, settings = defaults) {

    this.domNode = document.createElement('div');
    this.domNode.className = 'gutter';
    parentElem.appendChild(this.domNode);

    this.activeLineElem = null;
    this.lineElems = [null];
    this.lastLineNumDigits = 1; // The number of digits in the last line's number.

    this.charWidth = settings.charWidth || defaults.charWidth;
    this.charHeight = settings.charHeight || defaults.charHeight;
    this.pad = settings.pad || defaults.pad;
    this.onWidthChanged = settings.onWidthChanged || defaults.onWidthChanged;

    this.domNode.style.width = this._calculateWidth() + 'px';
}

GutterView.prototype.appendLine = function() {
    const line = document.createElement('span');
    line.className = 'gutter-line';
    line.innerHTML = this.lineElems.length;

    this.lineElems.push(line);
    this.domNode.appendChild(line);

    if (this.isVisible()) {
        this._checkUpdateWidth();    
    }    
};

GutterView.prototype.removeLine = function() {
    if (this.lineElems.length < 2) {
        throw new Error('GutterView: No line to remove.');
    }
    
    const removed = this.lineElems.splice(this.lineElems.length - 1, 1)[0];
    this.domNode.removeChild(removed);

    if (this.isVisible()) {
        this._checkUpdateWidth();    
    }    
};

GutterView.prototype.setActiveLine = function(num) {
    const line = this.lineElems[num];
    if (!line) {
        throw new Error('GutterView: No line with number ' + num); 
    }
    if (this.activeLineElem) {
        this.activeLineElem.classList.remove('gutter-line-active');
    }
    line.classList.add('gutter-line-active');
    this.activeLineElem = line; 
};

GutterView.prototype.show = function() {
    this.domNode.classList.remove('hidden');
    this._checkUpdateWidth();
};

GutterView.prototype.hide = function() {
    this.domNode.classList.add('hidden');
};

GutterView.prototype.isVisible = function() {
    return !this.domNode.classList.contains('hidden');
};

GutterView.prototype.getLastLineNum = function() {
    return this.lineElems.length - 1;
};

GutterView.prototype.getHeightOfLines = function() {
    return Math.round(this.getLastLineNum() * this.charHeight);
};

GutterView.prototype.setScrollTop = function(num) {
    this.domNode.scrollTop = num;
};

GutterView.prototype.getWidth = function() {
    const width = parseInt(this.domNode.style.width);
    if (width == null) {
        throw new Error('GutterView: Unable to parse width.');
    }
    return this.isVisible() ? width : 0;
};

GutterView.prototype.setWidth = function(to) {
    this.domNode.style.width = to + 'px';
};

GutterView.prototype.setLeftOffset = function(num) {
    this.domNode.style.left = num + 'px';
};

GutterView.prototype._calculateWidth = function() {
    return (this.lastLineNumDigits * this.charWidth) + this.pad;
};

GutterView.prototype._checkUpdateWidth = function() {

    const actualLastLineNumDigits = numDigitsIn(this.getLastLineNum());

    if (actualLastLineNumDigits != this.lastLineNumDigits) {
        this.lastLineNumDigits = actualLastLineNumDigits;
        const width = this._calculateWidth();
        this.setWidth(width);
        this.onWidthChanged(width);
    }
};

module.exports = GutterView;
