'use strict';

const {EventEmitter} = require('events');

const defaultSettings = {
    topOffset: 0,
    leftOffset: 0
};

function GutterView(rootElem, config) {
    console.log('GutterView created.');

    this.emitter = new EventEmitter(); 

    this.activeRowElem = null;
    this.rowElems = [null];
    this.lastRowNumDigits = 1; // The number of digits in the last row's number.

    const _config = config || {};

    this.leftPad = 2;
    this.charWidth = _config.charWidth || 5;
    this.rightPad = 2;
    
    this.domNode = document.createElement('div');
    this.domNode.className = 'gutter';
    this.domNode.style.top = (_config.topOffset || defaultSettings.topOffset) + 'px';
    this.domNode.style.left = (_config.leftOffset || defaultSettings.leftOffset) + 'px';
    this.domNode.style.width = this.getWidth() + 'px';
    this.domNode.style.height = '100%';

    // Start with one row.
    this.appendRow();
    this.setActiveRow(1);

    rootElem.appendChild(this.domNode);
}

GutterView.prototype.appendRow = function() {
    const row = document.createElement('span');
    row.className = 'gutter-row';
    row.innerHTML = this.rowElems.length;

    this.rowElems.push(row);
    this.domNode.appendChild(row);

    this._checkUpdateWidth(); 
};

GutterView.prototype.removeRow = function() {
    if (this.rowElems.length < 2) {
        throw new Error('GutterView: No row to remove.');
    }
    const removed = this.rowElems.splice(this.rowElems.length - 1, 1)[0];
    this.domNode.removeChild(removed);
    
    this._checkUpdateWidth();
};

GutterView.prototype.setActiveRow = function(num) {
    const row = this.rowElems[num];
    if (!row) {
        throw new Error('GutterView: No row with number ' + num); 
    }
    if (this.activeRowElem) {
        this.activeRowElem.className = 'gutter-row'; 
    }
    row.className = 'gutter-row-active';
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
    return this.leftPad + (this.lastRowNumDigits * this.charWidth) + this.rightPad;
};

GutterView.prototype._checkUpdateWidth = function() {

    // TODO: Brute forcing this under assumption that
    //             1) efficiency gains are worthwhile
    //         and 2) the number of lines in a file won't exceed 100000 :)
    
    const lastRowNum = this.lastRowNum();
    
    let actualLastRowNumDigits;
    if (lastRowNum < 10) {
        actualLastRowNumDigits = 1;
    } else if (lastRowNum < 100) {
        actualLastRowNumDigits = 2;
    } else if (lastRowNum < 1000) {
        actualLastRowNumDigits = 3;
    } else if (lastRowNum < 10000) {
        actualLastRowNumDigits = 4;
    } else if (lastRowNum < 100000) {
        actualLastRowNumDigits = 5;
    } else {
        throw new Error("GutterView: Way too many lines! Can't set gutter width.");
    }

    if (actualLastRowNumDigits != this.lastRowNumDigits) {
        this.lastRowNumDigits = actualLastRowNumDigits;
        const width = this.getWidth();
        this.domNode.style.width = width + 'px';
        this.emitter.emit('width-changed', width);
    }
};

GutterView.prototype.onWidthChanged = function(callback) {
    this.emitter.on('width-changed', callback); 
};

module.exports.GutterView = GutterView;
