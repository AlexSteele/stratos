
const defaultSettings = {
    charWidth: 10,
    charHeight: 20,
    maxColumns: 120,
    maxRows: 50,
    leftOffset: 0
};

// TODO: Fix setting of height after insertion/line removal.

function BufferView(rootElem, config) {
    console.log('BufferView created.');

    const _config = config || {};

    this.lineElems = [null];
    this.charWidth = _config.charWidth || defaultSettings.charWidth; // pixels
    this.charHeight = _config.charHeight || defaultSettings.charHeight; // pixels
    this.maxColumns = _config.maxColumns || defaultSettings.maxColumns;
    this.maxRows = _config.maxRows || defaultSettings.maxRows;

    this.domNode = document.createElement('div');
    this.domNode.className = 'buffer';
    this.domNode.style.left = (_config.leftOffset || defaultSettings.leftOffset) + 'px';
    this.domNode.style.width = this.getWidth() + 'px';
    this.domNode.style.height = this.getHeight() + 'px';

    // Start with empty line.
    this.appendLine('');

    if (rootElem) {
        rootElem.appendChild(this.domNode); 
    } else {
        document.body.appendChild(this.domNode); 
    }
}

BufferView.prototype.appendLine = function(text) {
    this.insertLine(this.lineElems.length, text);
};

BufferView.prototype.changeLine = function(num, text) {
    if (num < 1 || num > this.lineElems.length) {
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

BufferView.prototype.lastRowNum = function() {
    return this.lineElems.length - 1;
};

BufferView.prototype.setLeftOffset = function(width) {
    this.domNode.style.left = width + 'px';
};

BufferView.prototype.getWidth = function() { return this.maxColumns * this.charWidth; };
BufferView.prototype.getHeight = function() { return this.maxRows * this.charHeight; };

module.exports.BufferView = BufferView; 
