
function BufferView(rootElem) {
    console.log('BufferView created.');

    this.lineElems = [null]; 

    this.domNode = document.createElement('div');
    this.domNode.className = 'buffer';
    this.domNode.style.width = '50%';
    this.domNode.style.height = '100%'; 

    if (rootElem) {
        rootElem.appendChild(this.domNode); 
    } else {
        document.body.appendChild(this.domNode); 
    }
}

BufferView.prototype.appendLine = function(text) {
    const line = document.createElement('span');
    line.className = 'line';
    line.innerHTML = text;

    this.lineElems.push(line);
    this.domNode.appendChild(line);
};

BufferView.prototype.changeLine = function(num, text) {
    const line = this.lineElems[num];
    if (!line) {
        throw new Error('BufferView: No line with number ' + num); 
    }
    line.innerHTML = text; 
};

BufferView.prototype.insertLine = function(num, text) {
    if (num < 1 || num > this.lineElems.length()) {
        throw new Error('BufferView: No line with number ' + num); 
    }
    
    const line = document.createElement('span');
    line.className = 'line';
    line.innerHTML = text;

    this.lineElems.splice(num, 0, line);
    this.domNode.insertBefore(line, this.lineElems[num + 1]); 
};

BufferView.prototype.removeLine = function(num) {
    const removed = this.lineElems.splice(num, 1)[0];
    if (!removed) {
        throw new Error('BufferView: No line with number ' + num); 
    }
    
    this.domNode.removeChild(removed); 
};

module.exports.BufferView = BufferView; 
