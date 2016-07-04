'use strict';

const defaultSettings = {
    startingCol: 1,
    startingRow: 1,
    goalCol: 1,
    charWidth: 10,
    charHeight: 20,
    topOffset: 0,
    leftOffset: 25
};

function CursorView(rootElem, config = defaultSettings) {

    this.col = config.startingCol || defaultSettings.startingCol;
    this.row = config.startingRow || defaultSettings.startingRow;
    this.goalCol = config.goalCol || defaultSettings.goalCol;
    this.charWidth = config.charWidth || defaultSettings.charWidth;
    this.charHeight = config.charHeight || defaultSettings.charHeight;
    this.topOffset = config.topOffset || defaultSettings.topOffset;
    this.leftOffset = config.leftOffset || defaultSettings.leftOffset;

    this.domNode = document.createElement('div');
    this.domNode.className = 'cursor';
    this.domNode.style.width = 0.5 + 'px';
    this.domNode.style.height = this.charHeight + 'px'; 
    this.domNode.style.left = this._colToPix();
    this.domNode.style.top = this._rowToPix(); 
    this.domNode.style.visibility = 'visible';

    this.setBlink(true); 

    rootElem.appendChild(this.domNode);
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
    this.row += amount;
    this.domNode.style.top = this._rowToPix();
    this.setCol(this.goalCol);
    this.setBlink(true);
};

CursorView.prototype.moveUp = function(delta) {
    const amount = delta || 1;
    this.setBlink(false);
    this.row -= amount;
    this.domNode.style.top = this._rowToPix();
    this.setCol(this.goalCol);
    this.setBlink(true);
};

CursorView.prototype.moveTo = function(col, row) {
    this.col = col;
    this.row = row;
    this.setBlink(false);
    this.domNode.style.left = this._colToPix();
    this.domNode.style.top = this._rowToPix();
    this.setBlink(true); 
};

// A fast lateral move. Does not affect the goal column.
CursorView.prototype.setCol = function(col) {
    this.col = col;
    this.domNode.style.left = this._colToPix();
};

CursorView.prototype.setBlink = function(on) {
    if (on) {
        this.blinkIntervalId = setInterval(() => {
            this.domNode.style.visibility =
                    this.domNode.style.visibility === 'visible' ?
                        'hidden' :
                        'visible';
        }, 500);
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

CursorView.prototype._rowToPix = function() {
    return (this.topOffset + (this.row - 1) * this.charHeight) + 'px';
};

module.exports.CursorView = CursorView; 
