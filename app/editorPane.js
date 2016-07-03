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

    this.domNode.addEventListener('keydown', (e) => {
        e.preventDefault();
        const keyMap = {
            'Enter': {type: 'INSERT_NEW_LINE'},
            'ArrowLeft': {type: 'MOVE_CURSOR_LEFT'},
            'ArrowRight': {type: 'MOVE_CURSOR_RIGHT'},
            'ArrowUp': {type: 'MOVE_CURSOR_UP'},
            'ArrowDown': {type: 'MOVE_CURSOR_DOWN'},
            'Backspace': {type: 'DELETE_BACK_CHAR'}
        };

        const action = keyMap[e.key];
        if (action) {
            this.handleAction(action); 
        } else if (e.key !== 'Shift' && e.key !== 'Meta'){
            this.handleAction({
                type: 'INSERT',
                key: e.key
            });
        }
    });

    window.onscroll = () => {
        console.log('scrolled'); // TODO: remove
    };

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

EditorPane.prototype.handleAction = function(action) {
    console.log('EditorPane: Handling action ' + action);
    console.log('First visible row: ' + this.bufferView.firstVisibleRowNum());
    console.log('Last visible row: ' + this.bufferView.lastVisibleRowNum());
    switch (action.type) {
    case 'INSERT':
            this.bufferView.changeLine(this.cursorView.row,
                                   this.bufferView.lineElems[this.cursorView.row].innerHTML.slice(0, this.cursorView.col - 1) +
                                   action.key +
                                   this.bufferView.lineElems[this.cursorView.row].innerHTML.slice(this.cursorView.col - 1));
        this.cursorView.moveRight();
        break;
	case 'INSERT_NEW_LINE':
        this.bufferView.insertLine(this.cursorView.row + 1, '');
        this.cursorView.moveTo(1, this.cursorView.row + 1);
        this.gutterView.appendRow();
        this.gutterView.setActiveRow(this.cursorView.row);
        break;
        // case 'INSERT_TAB':
	case 'DELETE_BACK_CHAR':
        if (this.cursorView.col > 1) {
            this.bufferView.changeLine(this.cursorView.row,
                                       this.bufferView.lineElems[this.cursorView.row].innerHTML.slice(0, this.cursorView.col - 2));
            this.cursorView.moveLeft();             
        }
        break;
        // case 'DELETE_FORWARD_CHAR':
	    // case 'DELETE_BACK_WORD':
	    // case 'DELETE_FORWARD_WORD':
	    // case 'KILL_BACK_LINE':
	    // case 'KILL_FORWARD_LINE':
	    // case 'KILL_LINE':
	    // case 'REPEAT_LAST_ACTION':
	    // case 'UNDO_ACTION':
	    // case 'REDO_ACTION':
	    // case 'SEARCH_BACK':
	    // case 'WRAP_LINES':
	    // case 'GET_SENTENCE_BEGINNING':
	    // case 'GET_SENTENCE_END':
	    // case 'GET_PARAGRAPH_BEGINNING':
	    // case 'GET_PARAGRAPH_END':
	    // case 'GET_LINE':
	    // case 'GET_MAX_OFFSET_FOR_LINE':
	    // case 'GET_LINE_RANGE':
	    // case 'GET_LINES':
	    // case 'SET_MODE':
    case 'MOVE_CURSOR_LEFT':
        if (this.cursorView.col > 1) {
            this.cursorView.moveLeft();
        }
        break;
	case 'MOVE_CURSOR_RIGHT':
        if (this.cursorView.col <= this.bufferView.getLineWidthChars(this.cursorView.row)) {
            this.cursorView.moveRight();            
        }
        break;
	case 'MOVE_CURSOR_UP':
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
        break;
	case 'MOVE_CURSOR_DOWN':
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
        break;
	case 'MOVE_CURSOR_END_OF_LINE':
        break;
	case 'MOVE_CURSOR_BEGINNING_OF_LINE':
        break;
	case 'MOVE_CURSOR_BUFFER_END':
        break;
	case 'MOVE_CURSOR_BUFFER_BEGINNING':
        break;
	case 'MOVE_CURSOR_END_OF_PARAGRAPH':
        break;
	case 'MOVE_CURSOR_BEGINNING_OF_PARAGRAPH':
        break;
	case 'MOVE_CURSOR_END_OF_SENTENCE':
        break;
	case 'MOVE_CURSOR_BEGINNING_OF_SENTENCE':
        break;
	case 'MOVE_CURSOR_PREV_POS':
        break;
	    // case 'SCROLL_UP':
	    // case 'SCROLL_DOWN':
	    // case 'PAGE_UP':
	    // case 'PAGE_DOWN':
    default:
        throw new Error('EditorPane: Action handler not implemented for ' + action); 
    }
};

module.exports.EditorPane = EditorPane;
