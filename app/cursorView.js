
function CursorView(rootElem, config) {
    console.log('CursorView created.');

    const _config = config || {};

    this.col = _config.col || 1;
    this.row = _config.row || 1;
    this.charWidth = _config.charWidth || 10;
    this.charHeight = _config.charHeight || 20;
    this.leftOffset = _config.leftOffset || 25; // TODO: HARD CODED

    this.domNode = document.createElement('div');
    this.domNode.className = 'cursor';
    this.domNode.style.width = 0.5 + 'px';
    this.domNode.style.height = this.charHeight + 'px'; 
    this.domNode.style.left = '0px';
    this.domNode.style.top = '0px'; 
    this.domNode.style.visibility = 'visible';

    this.setBlink(true); 

    if (rootElem) {
        rootElem.appendChild(this.domNode);
    } else {
        document.body.appendChild(this.domNode); 
    }
}

CursorView.prototype.moveLeft = function(delta) {
    const amount = delta || 1;
    this.setBlink(false);
    this.col -= amount;
    this.domNode.style.left = this._colToPix();
    this.setBlink(true); 
};

CursorView.prototype.moveRight = function(delta) {
    const amount = delta || 1;
    this.setBlink(false);
    this.col += amount;
    this.domNode.style.left = this._colToPix();
    this.setBlink(true);
};

CursorView.prototype.moveDown = function(delta) {
    const amount = delta || 1;
    this.setBlink(false);
    this.row += amount;
    this.domNode.style.top = this._rowToPix();
    this.setBlink(true);
};

CursorView.prototype.moveUp = function(delta) {
    const amount = delta || 1;
    this.setBlink(false);
    this.row -= amount;
    this.domNode.style.top = this._rowToPix();
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

CursorView.prototype._colToPix = function() {
    return (this.leftOffset + (this.col - 1) * this.charWidth) + 'px';
};

CursorView.prototype._rowToPix = function() {
    return ((this.row - 1) * this.charHeight) + 'px';
};

module.exports.CursorView = CursorView; 
