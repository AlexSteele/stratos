
const defaultSettings = {
    startingCol: 1,
    startingRow: 1,
    goalCol: 1,
    charWidth: 10,
    charHeight: 20,
    topOffset: 0,
    leftOffset: 25
};

function CursorView(rootElem, config) {
    console.log('CursorView created.');

    const _config = config || {};

    this.col = _config.startingCol || defaultSettings.startingCol;
    this.row = _config.startingRow || defaultSettings.startingRow;
    this.goalCol = _config.goalCol || defaultSettings.goalCol;
    this.charWidth = _config.charWidth || defaultSettings.charWidth;
    this.charHeight = _config.charHeight || defaultSettings.charHeight;
    this.topOffset = _config.topOffset || defaultSettings.topOffset; 
    this.leftOffset = _config.leftOffset || defaultSettings.leftOffset;

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
