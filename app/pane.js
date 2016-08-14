'use strict';

const BufferModel = require('./bufferModel.js');
const KeyListener = require('./keyListener.js');
const {numDigitsIn} = require('./utils.js');
const Editor = require('./editor.js');
const TabBar = require('./tabBar.js');

const defaults = {
    keyMaps: {},
    height: 0,
    width: 0,
    topOffset: 0,
    leftOffset: 0,
    neighbors: {
        above: undefined,
        below: undefined,
        left:  undefined,
        right: undefined
    },
    sharedEditorComponentSettings: {
        charWidth: 0,
        charHeight: 0
    },
    bufferSettings: {},
    onUnknownAction: (action) => { throw new Error('Pane: No handler for action ' + action); },
    onCursorMoved: (line, col) => { throw new Error('Pane: No handler for onCursorMoved.'); },
    onNewEditor: () => { throw new Error('Pane: No handler for onNewEditor.'); },
    onSwitchEditor: (newActivePane) => { throw new Error('Pane: No handler for onSwitchEditor.'); },
    onCloseEditor: () => { throw new Error('Pane: No handler for onCloseEditor.'); },
    onActiveEditorNameChanged: (newName) => { throw new Error('Pane: No handler for onActiveEditorNameChanged.'); },
    onFocus: (this_Pane) => { throw new Error('Pane: No handler for onFocus.'); }
};

function Pane(parentElem, settings = defaults) {
    this.editors = [];
    this.activeEditor = null;
    this.prevActivePane = null;
    this._isActive = false;

    this.domNode = document.createElement('div');
    this.domNode.className = 'pane';
    this.setHeight(settings.height == null ? defaults.height : settings.height);
    this.setWidth(settings.width == null ? defaults.width : settings.width);
    this.setTopOffset(settings.topOffset == null ? defaults.topOffset : settings.topOffset);
    this.setLeftOffset(settings.leftOffset == null ? defaults.leftOffset : settings.leftOffset);
    parentElem.appendChild(this.domNode);

    this.parentElem = parentElem;
    this.keyMaps = settings.keyMaps || defaults.keyMaps;
    this.neighbors = settings.neighbors || defaults.neighbors;
    this.sharedEditorComponentSettings = settings.sharedEditorComponentSettings || defaults.sharedEditorComponentSettings;
    this.bufferSettings = settings.bufferSettings || defaults.bufferSettings;
    this.onUnknownAction = settings.onUnknownAction || defaults.onUnknownAction;
    this.onCursorMoved = settings.onCursorMoved || defaults.onCursorMoved;
    this.onNewEditor = settings.onNewEditor || defaults.onNewEditor;
    this.onSwitchEditor = settings.onSwitchEditor || defaults.onSwitchEditor;
    this.onCloseEditor = settings.onCloseEditor || defaults.onCloseEditor;
    this.onActiveEditorNameChanged = settings.onActiveEditorNameChanged || defaults.onActiveEditorNameChanged;
    this.onFocus = settings.onFocus || defaults.onFocus;
        
    // Only active when no panes are open. This is to allow, for instance,
    // an 'open tab' keybinding even when no EditorPanes are active.
    this.noEditorsKeyListener = new KeyListener(document.body, {
        keyMap: this.keyMaps['no-editors'],
        allowDefaultOnKeyError: true,
        onKeyAction: (action) => this._handleAction(action),
        onKeyError: (error) => console.log('Pane: Key error: ' + error)
    });
    
    this.tabBar = new TabBar(this.domNode, {
        onTabClick: (name) => this.switchEditor(name)
    });

    this._initEventListeners();

    // Inactive with one tab/editor by default.
    this.newEditor();
    this.setInactive();
};

Pane.prototype._initEventListeners = function() {
    this.domNode.addEventListener('mousedown', () => {
        if (!this.isActive()) {
            this.onFocus(this);
        }
    });
};

Pane.prototype.newEditor = function(name = 'untitled', fileName) {
    const buffer = new BufferModel(Object.assign({}, this.bufferSettings, {fileName: fileName}));
    const tabName = fileName ? this._getUniqueTabName(buffer.getFileBaseName()) : this._getUniqueTabName(name);
    const tabsHeight = this.tabBar.getVisibleHeight();
    const editor = new Editor(this.domNode, buffer, {
        buffer,
        tabName,
        keyMap: this.keyMaps['editor'],
        height: this.getHeight() - tabsHeight,
        width: this.getWidth(),
        topOffset: tabsHeight,
        sharedEditorComponentSettings: this.sharedEditorComponentSettings,
        onUnknownAction: (action) => this._handleAction(action),
        onCursorMoved: this.onCursorMoved,
        onNameChanged: (oldName, newName) => {
            this.tabBar.rename(oldName, newName);
            this.onActiveEditorNameChanged(newName);
        }
    });
    
    this.editors.push(editor);
    this.tabBar.add(tabName);
    this.switchEditor(tabName);

    if (this.editors.length === 1) {
        this.noEditorsKeyListener.unattach();
    }

    this.onNewEditor(editor);
};

// If _tabName is undefined, switches to the previously opened tab.
Pane.prototype.switchEditor = function(tabName) {
    if (this.activeEditor && tabName === this.activeEditor.tabName) return;
    
    const toSwitchTo = tabName ?
              this.editors.find(e => e.tabName === tabName) :
              this.prevActivePane;

    if (!toSwitchTo) return;
    
    if (this.activeEditor) {
        this.activeEditor.setInactive();
        this.activeEditor.hide();
    }

    this.prevActivePane = this.activeEditor;
    this.activeEditor = toSwitchTo;
    this.activeEditor.show();

    if (this.isActive()) {
        this.activeEditor.setActive();
    }
    
    this.tabBar.setSelected(this.activeEditor.tabName);
    this.onSwitchEditor(this.activeEditor);
};

// If tabName is undefined, closes the active tab.
Pane.prototype.closeEditor = function(_tabName) {
    if (!_tabName && !this.activeEditor) return;

    const tabName = _tabName || this.activeEditor.tabName;
    const paneIndex = this.editors.findIndex(e => e.tabName === tabName);
    const pane = this.editors.splice(paneIndex, 1)[0];

    this.tabBar.remove(pane.tabName);
    this.domNode.removeChild(pane.domNode);
    
    if (pane === this.activeEditor) {
        this.activeEditor = null;
        this.switchEditor();
    } else if (pane === this.prevActivePane) {
        this.prevActivePane = null;
    }

    // We lose the prevActivePane when either the activePane or prevActivePane is closed.
    if (!this.prevActivePane) {
        this.prevActivePane = this.editors.find(e => e !== this.activeEditor) || null;
    }

    if (this.editors.length === 0) {
        this.noEditorsKeyListener.attach();
    }

    this.onCloseEditor();
};

Pane.prototype.closeAllEditors = function() {
    this.editors.forEach(e => {
        this.tabBar.remove(e.tabName);
        this.domNode.removeChild(e.domNode);
    });
    this.editors = [];
    this.activeEditor = null;
    this.prevActivePane = null;
    this.noEditorsKeyListener.attach();
};

// Returns the first neighbor whose left offset (if side is 'above' or 'below')
// or top offset (if side is 'left' or 'right') is greater than this group's
// left or top offset, respectfully.
Pane.prototype.getFirstFullNeighbor = function(side) {
    const startsAfterEdge = (side === 'above' || side === 'below') ?
              (neighbor) => neighbor.getLeftOffset() >= this.getLeftOffset() :
              (neighbor) => neighbor.getTopOffset() >= this.getTopOffset();

    return this.getNeighbors(side).find(e => startsAfterEdge(e));
};

Pane.prototype.getNeighbors = function(side) {
    if (side !== 'above' && side !== 'below' && side !== 'left' && side !== 'right') {
        throw new Error('Unrecognized side: ' + side);
    }
    
    if (!this.neighbors[side]) return [];

    const searchDirections = (side === 'above' || side === 'below') ? ['left', 'right'] : ['above', 'below'];
    const neighbors = searchDirections.map(direction => {
        const toAdd = [];
        for (let curr = this.neighbors[side].neighbors[direction];
             curr && this.doesShareBorder(curr, side);
             curr = curr.neighbors[direction])
        {
            toAdd.push(curr);
        }
        return toAdd;
    });
    return neighbors[0].reverse().concat(this.neighbors[side]).concat(neighbors[1]);  
};

// Returns whether the given Pane shares a border with this group
// on the given side. Sharing a border requires overlap of more than
// a single pixel.
Pane.prototype.doesShareBorder = function(group, side) {
    if (side !== 'above' && side !== 'below' && side !== 'left' && side !== 'right') {
        throw new Error('Unrecognized side: ' + side);
    }

    function doesOverlap(x1, x2, y1, y2) {
        return x1 < y2 && y1 < x2;
    }

    switch (side) {
    case 'above':
        return group.getBottomOffset() === this.getTopOffset() &&
            doesOverlap(this.getLeftOffset(), this.getRightOffset(),
                        group.getLeftOffset(), group.getRightOffset());
    case 'below':
        return group.getTopOffset() === this.getBottomOffset() &&
            doesOverlap(this.getLeftOffset(), this.getRightOffset(),
                        group.getLeftOffset(), group.getRightOffset());
    case 'left':
        return group.getRightOffset() === this.getLeftOffset() &&
            doesOverlap(this.getTopOffset(), this.getBottomOffset(),
                        group.getTopOffset(), group.getBottomOffset());
    case 'right':
        return group.getLeftOffset() === this.getRightOffset() &&
            doesOverlap(this.getTopOffset(),this.getBottomOffset(),
                        group.getTopOffset(), group.getBottomOffset());
    }
};

Pane.prototype.showTabBar = function() {
    if (!this.tabBar.isVisible()) {
        this.tabBar.show();
        this.editors.forEach(e => e.setTopOffset(this.tabBar.getVisibleHeight()));
        this._resizePanes();
    }
};

Pane.prototype.hideTabBar = function() {
    if (this.tabBar.isVisible()) {
        this.tabBar.hide();
        this.editors.forEach(e => e.setTopOffset(0));
        this._resizePanes();
    }
};

Pane.prototype.setActive = function() {
    this._isActive = true;
    if (this.activeEditor) {
        this.activeEditor.setActive();
        this.tabBar.setActive();
    } else {
        this.domNode.focus();
    }
};

Pane.prototype.setInactive = function() {
    this._isActive = false;
    if (this.activeEditor) {
        this.activeEditor.setInactive();
        this.tabBar.setInactive();
    } else {
        this.domNode.blur();
    }
};

Pane.prototype.isActive = function() {
    return this._isActive;
};

Pane.prototype.show = function() {
    this.domNode.classList.remove('hidden');
};

Pane.prototype.hide = function() {
    this.domNode.classList.add('hidden');
};

Pane.prototype.getEditorCount = function() {
    return this.editors.length;
};

Pane.prototype.setHeight = function(to) {
    this.domNode.style.height = to + 'px';
    this._resizePanes();
};

Pane.prototype.getHeight = function() {
    const height = parseInt(this.domNode.style.height);
    if (height == null) {
        throw new Error('Pane: Unable to parse height.');
    }
    return height;
};

Pane.prototype.setWidth = function(to) {
    this.domNode.style.width = to + 'px';
    this._resizePanes();
};

Pane.prototype.getWidth = function() {
    const width = parseInt(this.domNode.style.width);
    if (width == null) {
        throw new Error('PangeGroup: Unable to parse width.');
    }
    return width;
};

Pane.prototype.setTopOffset = function(to) {
    this.domNode.style.top = to + 'px';
};

Pane.prototype.getTopOffset = function() {
    const offset = parseInt(this.domNode.style.top);
    if (offset == null) {
        throw new Error('Pane: Unable to parse topOffset.');
    }
    return offset;
};

Pane.prototype.setLeftOffset = function(to) {
    this.domNode.style.left = to + 'px';
};

Pane.prototype.getLeftOffset = function() {
    const offset = parseInt(this.domNode.style.left);
    if (offset == null) {
        throw new Error('Pane: Unable to parse leftOffset.');
    }
    return offset;
};

Pane.prototype.getRightOffset = function() {
    return this.getLeftOffset() + this.getWidth();
};

Pane.prototype.getBottomOffset = function() {
    return this.getTopOffset() + this.getHeight();
};

Pane.prototype._resizePanes = function() {
    if (!this.activeEditor) return;
    
    const panesHeight = this.getHeight() - this.tabBar.getVisibleHeight();
    const panesWidth = this.getWidth();

    if (this.activeEditor.getHeight() !== panesHeight) {
        this.editors.forEach(e => e.setHeight(panesHeight));    
    }
    if (this.activeEditor.getWidth() !== panesWidth) {
        this.editors.forEach(e => e.setWidth(panesWidth));    
    }    
};

// If an editor pane exists with the same name as that given, returns a unique
// version of the name of the form `name-{Unique Number}`. Otherwise, returns the given name.
Pane.prototype._getUniqueTabName = function(name) {    
    const suffixNum = this.editors.reduce((prev, curr) => {
        if (prev === 0 && curr.tabName === name) {
            return prev + 1;
        }
        if (prev > 0) {
            // untitled(1) -> untitled
            const sansSuffix = curr.tabName.slice(0, curr.tabName.length - numDigitsIn(prev) - 2);
            if (sansSuffix === name) {
                return prev + 1;   
            }
        }

        return prev;
    }, 0);

    return suffixNum === 0 ? name : name + '(' + suffixNum + ')';
};

Pane.prototype._handleAction = function(action) {

    const handlers = {
        'NEW_EDITOR':    (action) => this.newEditor(action.name),
        'OPEN_FILE':     (action) => this.newEditor(action.name, action.name),
        'SWITCH_EDITOR': (action) => this.switchEditor(action.name),
        'CLOSE_EDITOR':  (action) => this.closeEditor(action.name),
        'CLOSE_ALL':     () => this.closeAllEditors(),
        'SHOW_TABS':     () => this.showTabBar(),
        'HIDE_TABS':     () => this.hideTabBar()
    };
    
    const handler = handlers[action.type];

    if (handler) {
        handler(action);
    } else {
        this.onUnknownAction(action);
    }
};

module.exports = Pane;
