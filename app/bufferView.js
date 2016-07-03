
const defaultSettings = {
    charWidth: 10,
    charHeight: 20,
    maxColumns: 120,
    maxRows: 50,
    leftOffset: 0
};

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
    this.domNode.style.width = (this.maxColumns * this.charWidth) + 'px';
    this.domNode.style.height = (this.maxRows * this.charHeight) + 'px';

    // Start with empty line.
    this.appendLine(' ');

    if (rootElem) {
        rootElem.appendChild(this.domNode); 
    } else {
        document.body.appendChild(this.domNode); 
    }
}

BufferView.prototype.appendLine = function(text) {
    const line = document.createElement('span');
    line.className = 'line';
    line.style.height = this.charHeight;
    line.innerHTML = text;

    this.lineElems.push(line);
    this.domNode.appendChild(line);
};

BufferView.prototype.changeLine = function(num, text) {
    const line = this.lineElems[num];
    if (!line) {
        throw new Error('BufferView: No line with number ' + num); 
    }

    console.log('Changing line ' + num); // TODO: remove
    line.innerHTML = text; 
};

BufferView.prototype.insertLine = function(num, text) {
    if (num < 1 || num > this.lineElems.length) {
        throw new Error('BufferView: No line with number ' + num); 
    }
    if (num === this.lineElems.length) {
        this.appendLine(text);
        return;
    }
    
    const line = document.createElement('span');
    line.className = 'line';
    line.innerHTML = text;

    this.lineElems.splice(num, 0, line);
    this.domNode.insertBefore(line, this.lineElems[num + 1]); 
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

module.exports.BufferView = BufferView; 
