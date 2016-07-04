'use strict';

const {BufferView} = require('./bufferView.js'); 
const {CursorView} = require('./cursorView.js');
const {GutterView} = require('./gutterView.js');
const {viewHelpers} = require('./viewHelpers.js');

function EditorPane(rootElem) {

    this.domNode = document.createElement('div');
    this.domNode.className = 'editor-pane';
    this.domNode.tabIndex = 1;
    
    const sharedViewConfig = viewHelpers.getSharedViewConfig(document.body);

    this.bufferView = new BufferView(this.domNode, sharedViewConfig);
    this.cursorView = new CursorView(this.domNode, sharedViewConfig);
    this.gutterView = new GutterView(this.domNode, sharedViewConfig);

    this._initComponents();
    
    rootElem.appendChild(this.domNode);
}

EditorPane.prototype._initComponents = function() {

    this.bufferView.setLeftOffset(this.gutterView.getWidth()); 
    this.cursorView.setLeftOffset(this.gutterView.getWidth());

    this.bufferView.onScroll((event) => {
        this.cursorView.setScrollTop(this.bufferView.getScrollTop());
        this.gutterView.setScrollTop(this.bufferView.getScrollTop());
    });

    this.gutterView.onWidthChanged((width) => {
        this.cursorView.setLeftOffset(width);
        this.bufferView.setLeftOffset(width); 
    });
};

EditorPane.prototype.setFocused = function() {
    this.domNode.focus();
};

EditorPane.prototype.insertText = function(text) {
    this.bufferView.setLine(this.cursorView.row,
                               this.bufferView.getLine(this.cursorView.row).slice(0, this.cursorView.col - 1) +
                               text +
                               this.bufferView.getLine(this.cursorView.row).slice(this.cursorView.col - 1));
    
    this.cursorView.moveRight(text.length);
};

EditorPane.prototype.insertNewLine = function() {
    const line = this.bufferView.getLine(this.cursorView.row);
    const toRemain = line.substr(0, this.cursorView.col - 1);
    const toGo = line.substr(this.cursorView.col - 1);

    this.bufferView.setLine(this.cursorView.row, toRemain);
    this.bufferView.insertLine(this.cursorView.row + 1, toGo);
    this.cursorView.moveTo(1, this.cursorView.row + 1);
    this.gutterView.appendRow();
    this.gutterView.setActiveRow(this.cursorView.row);  
};

EditorPane.prototype.deleteBackChar = function() {
    if (this.cursorView.col === 1) {
        const prevLine = this.bufferView.getLine(this.cursorView.row - 1);
        this.bufferView.setLine(this.cursorView.row - 1,
                                prevLine + this.bufferView.getLine(this.cursorView.row));
        this.bufferView.removeLine(this.cursorView.row);
        this.cursorView.moveTo(prevLine.length + 1, this.cursorView.row - 1);
        this.gutterView.removeRow();
        this.gutterView.setActiveRow(this.cursorView.row);
    } else {
        const line = this.bufferView.getLine(this.cursorView.row);
        this.bufferView.setLine(this.cursorView.row,
                                line.slice(0, this.cursorView.col - 2) +
                                line.slice(this.cursorView.col - 1));
        this.cursorView.moveLeft();             
    }
};

EditorPane.prototype.killLine = function() {
    this.bufferView.setLine(this.cursorView.row,
                            this.bufferView.getLine(this.cursorView.row).slice(0, this.cursorView.col - 1));
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
        if (this.cursorView.row < this.bufferView.getFirstVisibleRowNum()) {
            this.bufferView.scrollUpRow();
        }
        this.gutterView.setActiveRow(this.cursorView.row);
    }    
};

EditorPane.prototype.moveCursorDown = function() {
    if (this.cursorView.row < this.bufferView.getLastRowNum()) {
        this.cursorView.moveDown();
        const lineWidth = this.bufferView.getLineWidthChars(this.cursorView.row);
        if (this.cursorView.col > lineWidth + 1) {
            this.cursorView.setCol(lineWidth + 1);
        } 
        if (this.cursorView.row > this.bufferView.getLastVisibleRowNum()) {
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
