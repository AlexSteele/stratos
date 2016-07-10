'use strict';

const defaultSettings = {
    charWidth: 10,
    charHeight: 20,
    startingCol: 1,
    startingLine: 1,
    goalCol: 1,
    leftOffset: 25,
    blinkFreqMs: 500
};

function CursorView(parentElem, config = defaultSettings) {

    this.col = config.startingCol || defaultSettings.startingCol;
    this.line = config.startingLine || defaultSettings.startingLine;
    this.goalCol = config.goalCol || defaultSettings.goalCol;
    this.charWidth = config.charWidth || defaultSettings.charWidth;
    this.charHeight = config.charHeight || defaultSettings.charHeight;
    this.leftOffset = config.leftOffset || defaultSettings.leftOffset;
    this.blinkFreqMs = config.blinkFreqMs || defaultSettings.blinkFreqMs;

    this.domNode = document.createElement('div');
    this.domNode.className = 'cursor';
    this.domNode.style.width = 0.5 + 'px';
    this.domNode.style.height = this.charHeight + 'px'; 
    this.domNode.style.top = this._lineToPix(); 
    this.domNode.style.left = this._colToPix();
    this.domNode.style.visibility = 'visible';

    this.setBlink(true); 

    parentElem.appendChild(this.domNode);
}

CursorView.prototype.moveLeft = function(delta) {
    const amount = delta || 1;
    this.setBlink(false);
    this.col -= amount;
    this.goalCol = this.col;
    this.domNode.style.left = this._colToPix();
    this.setBlink(true); 
};

CursorView.prototype.moveRight = function(delta) {
    const amount = delta || 1;
    this.setBlink(false);
    this.col += amount;
    this.goalCol = this.col;
    this.domNode.style.left = this._colToPix();
    this.setBlink(true);
};

CursorView.prototype.moveDown = function(delta) {
    const amount = delta || 1;
    this.setBlink(false);
    this.line += amount;
    this.domNode.style.top = this._lineToPix();
    this.setCol(this.goalCol);
    this.setBlink(true);
};

CursorView.prototype.moveUp = function(delta) {
    const amount = delta || 1;
    this.setBlink(false);
    this.line -= amount;
    this.domNode.style.top = this._lineToPix();
    this.setCol(this.goalCol);
    this.setBlink(true);
};

CursorView.prototype.moveTo = function(col, line) {
    this.col = col;
    this.line = line;
    this.goalCol = this.col;
    this.setBlink(false);
    this.domNode.style.left = this._colToPix();
    this.domNode.style.top = this._lineToPix();
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

CursorView.prototype.setLeftOffset = function(width) {
    this.leftOffset = width;
    this.domNode.style.left = this._colToPix();
};

CursorView.prototype._colToPix = function() {
    return (this.leftOffset + (this.col - 1) * this.charWidth) + 'px';
};

CursorView.prototype._lineToPix = function() {
    return ((this.line - 1) * this.charHeight) + 'px';
};

module.exports.CursorView = CursorView;
