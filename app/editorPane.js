'use strict';

const {BufferView} = require('./bufferView.js'); 
const {CursorView} = require('./cursorView.js');
const {GutterView} = require('./gutterView.js');
const {viewHelpers} = require('./viewHelpers.js');

function EditorPane(rootElem) {
    console.log('EditorPane created.');

    this.domNode = document.createElement('div');
    this.domNode.className = 'editor-pane';
    this.domNode.tabIndex = 1;
    
    const sharedViewConfig = viewHelpers.getSharedViewConfig(rootElem);

    this.bufferView = new BufferView(this.domNode, sharedViewConfig);
    this.cursorView = new CursorView(this.domNode, sharedViewConfig);
    this.gutterView = new GutterView(this.domNode, sharedViewConfig);

    this._initComponents();
    
    rootElem.appendChild(this.domNode);
}

EditorPane.prototype._initComponents = function() {

    this.cursorView.setLeftOffset(this.gutterView.getWidth());
    this.bufferView.setLeftOffset(this.gutterView.getWidth()); 
    
    this.gutterView.onWidthChanged((width) => {
        this.cursorView.setLeftOffset(width);
        this.bufferView.setLeftOffset(width); 
    });
};

EditorPane.prototype.setFocused = function() {
    this.domNode.focus();
};

EditorPane.prototype.insertText = function(text) {
    this.bufferView.changeLine(this.cursorView.row,
        this.bufferView.lineElems[this.cursorView.row].innerHTML.slice(0, this.cursorView.col - 1) +
        text +
        this.bufferView.lineElems[this.cursorView.row].innerHTML.slice(this.cursorView.col - 1));
    
    this.cursorView.moveRight(text.length);
};

EditorPane.prototype.insertNewLine = function() {
    this.bufferView.insertLine(this.cursorView.row + 1, '');
    this.cursorView.moveTo(1, this.cursorView.row + 1);
    this.gutterView.appendRow();
    this.gutterView.setActiveRow(this.cursorView.row);  
};

EditorPane.prototype.deleteBackChar = function() {
    if (this.cursorView.col > 1) {
            this.bufferView.changeLine(this.cursorView.row,
                                       this.bufferView.lineElems[this.cursorView.row].innerHTML.slice(0, this.cursorView.col - 2));
        this.cursorView.moveLeft();             
    }
};

EditorPane.prototype.moveCursorLeft = function() {
     if (this.cursorView.col > 1) {
         this.cursorView.moveLeft();
     }
};

EditorPane.prototype.moveCursorRight = function() {
    if (this.cursorView.col <= this.bufferView.getLineWidthChars(this.cursorView.row)) {
        this.cursorView.moveRight();            
    }
};

EditorPane.prototype.moveCursorUp = function() {
    if (this.cursorView.row > 1) {
        this.cursorView.moveUp();
        const lineWidth = this.bufferView.getLineWidthChars(this.cursorView.row);
        if (this.cursorView.col > lineWidth + 1) {
            this.cursorView.setCol(lineWidth + 1);
        }
        if (this.cursorView.row < this.bufferView.firstVisibleRowNum()) {
            this.bufferView.scrollUpRow();
        }
        this.gutterView.setActiveRow(this.cursorView.row);
    }    
};

EditorPane.prototype.moveCursorDown = function() {
    if (this.cursorView.row < this.bufferView.lastRowNum()) {
        this.cursorView.moveDown();
        const lineWidth = this.bufferView.getLineWidthChars(this.cursorView.row);
        if (this.cursorView.col > lineWidth + 1) {
            this.cursorView.setCol(lineWidth + 1);
        } 
        if (this.cursorView.row > this.bufferView.lastVisibleRowNum()) {
            this.bufferView.scrollDownRow(); 
        }
        this.gutterView.setActiveRow(this.cursorView.row); 
    }
};

EditorPane.prototype.moveCursorBeginningOfLine = function() {
    this.cursorView.setCol(1);
};

EditorPane.prototype.moveCursorEndOfLine = function() {
    this.cursorView.setCol(this.bufferView.getLineWidthChars(this.cursorView.row) + 1);
};

module.exports.EditorPane = EditorPane;