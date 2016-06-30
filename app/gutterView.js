const {EventEmitter} = require('events');

function GutterView(rootElem, config) {
    console.log('GutterView created.');

    this.emitter = new EventEmitter(); 

    this.activeRowElem = null;
    this.rowElems = [null];

    const _config = config || {};

    this.leftPad = 2;
    this.charWidth = _config.charWidth || 5;
    this.rightPad = 2;
    // this.minWidth = ; // TODO: IMPLEMENT
    
    this.domNode = document.createElement('div');
    this.domNode.className = 'gutter';
    this.domNode.style.width = this.getWidth() + 'px'; // TODO: hard-coded
    this.domNode.style.height = '100%';

    // Start with one row.
    this.appendRow(); 

    if (rootElem) {
        rootElem.appendChild(this.domNode);
    } else {
        document.body.appendChild(this.domNode); 
    }
}

GutterView.prototype.appendRow = function() {
    const row = document.createElement('span');
    row.className = 'gutter-row';
    row.innerHTML = this.rowElems.length;

    this.rowElems.push(row);
    this.domNode.appendChild(row);
};

GutterView.prototype.removeRow = function() {
    if (this.rowElems.length < 2) {
        throw new Error('GutterView: No row to remove.');
    }
    const removed = this.rowElems.splice(this.rowElems.length - 1, 1)[0];
    this.domNode.removeChild(removed);
};

GutterView.prototype.setActiveRow = function(num) {
    const row = this.rowElems[num];
    if (!row) {
        throw new Error('GutterView: No row with number ' + num); 
    }
    if (this.activeRowElem) {
        this.activeRowElem.className = 'gutter-row'; 
    }
    row.className += 'gutter-row-active';
    this.activeRowElem = row; 
};

GutterView.prototype.hide = function() {
    this.domNode.style.visibility = 'hidden';   
};

GutterView.prototype.show = function() {
    this.domNode.style.visibility = 'visible';
};

GutterView.prototype.lastRowNum = function() {
    return this.rowElems.length - 1;
};

GutterView.prototype.getWidth = function() {
    return this.leftPad + this.charWidth + this.rightPad;
};

// TODO: USE THIS.
GutterView.prototype.onWidthChanged = function(callback) {
    this.emitter.on('width-changed', callback); 
};

module.exports.GutterView = GutterView;
