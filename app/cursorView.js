
function CursorView(domNode) {
    console.log('CursorView created.');

    this.top = 100; // TODO: FIX HARD CODED.
    this.left = 100; 
    this.charWidth = 10;
    this.charHeight = 20; 

    this.domNode = domNode || document.createElement('div');
    this.domNode.className = 'cursor';
    this.domNode.style.width = 0.5 + 'px';
    this.domNode.style.height = this.charHeight + 'px'; 
    this.domNode.style.top = this.top + 'px'; 
    this.domNode.style.left = this.left + 'px';

    this.visible = true; 

    this.blinkIntervalId =
        setInterval(() => {
            this.visible = !this.visible; 
            if (this.visible) {
                this.domNode.style.visibility = 'visible'; 
            } else {
                this.domNode.style.visibility = 'hidden'; 
            }
        }, 500);
}

CursorView.prototype.moveLeft = function(delta) {
    const amount = delta || 1;
    this.left -= amount * this.charWidth;
    this.domNode.style.left = this.left + 'px';
};

CursorView.prototype.moveRight = function(delta) {
    const amount = delta || 1;
    this.left += amount * this.charWidth;
    this.domNode.style.left = this.left + 'px';
};

CursorView.prototype.moveDown = function(delta) {
    const amount = delta || 1;
    this.top += amount * this.charWidth;
    this.domNode.style.top = this.top + 'px';
};

CursorView.prototype.moveUp = function(delta) {
    const amount = delta || 1;
    this.top -= amount * this.charWidth;
    this.domNode.style.top = this.top + 'px'; 
};

module.exports.CursorView = CursorView; 
