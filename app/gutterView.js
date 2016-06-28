
function GutterView(rootElem) {
    console.log('GutterView created.');

    this.activeRowElem = null;
    this.rowElems = [null];
    
    this.domNode = document.createElement('div');
    this.domNode.className = 'gutter';
    this.domNode.style.width = 25 + 'px'; // TODO: hard-coded
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

module.exports.GutterView = GutterView;
