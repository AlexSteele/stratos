'use strict';

const defaults = {
    charWidth: 10,
    charHeight: 20,
    startingCol: 1,
    startingLine: 1,
    goalCol: 1,
    leftOffset: 25,
    blinkFreqMs: 500
};

function CursorView(parentElem, settings = defaults) {

    this.col = settings.startingCol || defaults.startingCol;
    this.line = settings.startingLine || defaults.startingLine;
    this.goalCol = settings.goalCol || defaults.goalCol;
    this.charWidth = settings.charWidth || defaults.charWidth;
    this.charHeight = settings.charHeight || defaults.charHeight;
    this.leftOffset = settings.leftOffset || defaults.leftOffset;
    this.blinkFreqMs = settings.blinkFreqMs || defaults.blinkFreqMs;

    this.domNode = document.createElement('div');
    this.domNode.className = 'cursor';
    this.domNode.style.width = 0.5 + 'px';
    this.domNode.style.height = this.charHeight + 'px'; 
    this.domNode.style.top = this._lineToPix(); 
    this.domNode.style.left = this._colToPix();
    this.domNode.style.visibility = 'visible';
    parentElem.appendChild(this.domNode);
    
    this.setBlink(true);
}

CursorView.prototype.moveLeft = function(amount = 1) {
    this.setBlink(false);
    this.col -= amount;
    this.goalCol = this.col;
    this.domNode.style.left = this._colToPix();
    this.setBlink(true); 
};

CursorView.prototype.moveRight = function(amount = 1) {
    this.setBlink(false);
    this.col += amount;
    this.goalCol = this.col;
    this.domNode.style.left = this._colToPix();
    this.setBlink(true);
};

CursorView.prototype.moveDown = function(amount = 1) {
    this.setBlink(false);
    this.line += amount;
    this.domNode.style.top = this._lineToPix();
    this.setCol(this.goalCol);
    this.setBlink(true);
};

CursorView.prototype.moveUp = function(amount = 1) {
    this.setBlink(false);
    this.line -= amount;
    this.domNode.style.top = this._lineToPix();
    this.setCol(this.goalCol);
    this.setBlink(true);
};

CursorView.prototype.moveTo = function(line, col) {
    this.line = line;
    this.col = col;
    this.goalCol = this.col;
    this.setBlink(false);
    this.domNode.style.top = this._lineToPix();
    this.domNode.style.left = this._colToPix();
    this.setBlink(true); 
};

// A lateral move. Does not affect the goal column.
CursorView.prototype.setCol = function(col) {
    this.setBlink(false);
    this.col = col;
    this.domNode.style.left = this._colToPix();
    this.setBlink(true);
};

CursorView.prototype.setBlink = function(on) {
    if (on) {
        if (this.blinkIntervalId !== null) {
            clearInterval(this.blinkIntervalId);
            this.blinkIntervalId = null;
        }
        this.blinkIntervalId = setInterval(() => {
            this.domNode.style.visibility =
                    this.domNode.style.visibility === 'visible' ?
                        'hidden' :
                        'visible';
        }, this.blinkFreqMs);
    } else {
        clearInterval(this.blinkIntervalId);
        this.blinkIntervalId = null;
        this.domNode.style.visibility = 'visible';
    }
};

CursorView.prototype.show = function() {
    this.domNode.style.visibility = 'visible';
};

CursorView.prototype.hide = function() {
    this.setBlink(false);
    this.domNode.style.visibility = 'hidden';
};

CursorView.prototype.setLeftOffset = function(width) {
    this.leftOffset = width;
    this.domNode.style.left = this._colToPix();
};

CursorView.prototype.getLeftOffset = function() {
    return this.leftOffset;
};

CursorView.prototype._colToPix = function() {
    return (this.leftOffset + (this.col - 1) * this.charWidth) + 'px';
};

CursorView.prototype._lineToPix = function() {
    return ((this.line - 1) * this.charHeight) + 'px';
};

module.exports = CursorView;
