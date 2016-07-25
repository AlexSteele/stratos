'use strict';

const KeyListener = require('./keyListener.js');
const {numDigitsIn} = require('./utils.js');
const Pane = require('./Pane.js');
const TabBar = require('./tabBar.js');

const defaults = {
    keyMaps: {},
    height: 0,
    width: 0,
    topOffset: 0,
    leftOffset: 0,
    neighbors: {
        up:    null,
        down:  null,
        left:  null,
        right: null
    },
    sharedEditorComponentSettings: {
        charWidth: 0,
        charHeight: 0
    },
    onUnknownAction: (action) => { throw new Error('PaneGroup: No handler for action ' + action); },
    onCursorMoved: (line, col) => { throw new Error('PaneGroup: No handler for onCursorMoved.'); },
    onNewPane: () => { throw new Error('PaneGroup: No handler for onNewPane.'); },
    onSwitchPane: (newActivePane) => { throw new Error('PaneGroup: No handler for onSwitchPane.'); },
    onClosePane: () => { throw new Error('PaneGroup: No handler for onClosePane.'); },
    onFocused: (this_EditorPane) => { throw new Error('PaneGroup: No handler for onFocused.'); },
    onSplit: (newPaneGroup) => { throw new Error('PangeGroup: No handler for onSplit'); }
};

function PaneGroup(parentElem, settings = defaults) {
    this.panes = [];
    this.activePane = null;
    this.prevActivePane = null;

    this.domNode = document.createElement('div');
    this.domNode.className = 'pane-group';
    this.setHeight(settings.height == null ? defaults.height : settings.height);
    this.setWidth(settings.width == null ? defaults.width : settings.width);
    this.setTopOffset(settings.topOffset == null ? defaults.topOffset : settings.topOffset);
    this.setLeftOffset(settings.leftOffset == null ? defaults.leftOffset : settings.leftOffset);
    parentElem.appendChild(this.domNode);

    this.parentElem = parentElem;
    this.keyMaps = settings.keyMaps || defaults.keyMaps;
    this.neighbors = settings.neighbors || defaults.neighbors;
    this.sharedEditorComponentSettings = settings.sharedEditorComponentSettings || defaults.sharedEditorComponentSettings;
    this.onUnknownAction = settings.onUnknownAction || defaults.onUnknownAction;
    this.onCursorMoved = settings.onCursorMoved || defaults.onCursorMoved;
    this.onNewPane = settings.onNewPane || defaults.onNewPane;
    this.onSwitchPane = settings.onSwitchPane || defaults.onSwitchPane;
    this.onClosePane = settings.onClosePane || defaults.onClosePane;
    this.onSplit = settings.onSplit || defaults.onSplit;
    this.onFocus = settings.onFocus || defaults.onFocus;
        
    // Only active when no panes are open. This is to allow, for instance,
    // an 'open tab' keybinding even when no EditorPanes are active.
    this.noPanesKeyListener = new KeyListener(document.body, {
        keyMap: this.keyMaps['no-panes-default'],
        allowDefaultOnKeyError: true,
        onKeyAction: (action) => this._handleAction(action),
        onKeyError: (error) => console.log('Editor: Key error: ' + error)
    });
    
    this.tabBar = new TabBar(this.domNode, {
        onTabClick: (name) => this.switchPane(name)
    });

    // Inactive by default.
    this.setInactive();
    this._initEventListeners();
};

PaneGroup.prototype._initEventListeners = function() {
    this.domNode.addEventListener('focus', () => {
        this.onFocus(this);
    });
};

PaneGroup.prototype.newPane = function(name = 'untitled') {
    const tabName = this._getUniqueTabName(name);
    const tabsHeight = this.tabBar.getVisibleHeight();
    const height = this.getHeight() - tabsHeight;
    const pane = new Pane(this.domNode, {
        name,
        tabName,
        keyMap: this.keyMaps['editor-default'],
        height, 
        width: this.getWidth(),
        topOffset: tabsHeight,
        sharedEditorComponentSettings: this.sharedEditorComponentSettings,
        onUnknownAction: (action) => this._handleAction(action),
        onCursorMoved: this.onCursorMoved
    });
    
    this.panes.push(pane);
    this.tabBar.add(tabName);
    this.switchPane(tabName);

    if (this.panes.length === 1) {
        this.noPanesKeyListener.unattach();
    }

    this.onNewPane(pane);
};

// If _tabName is undefined, switches to the previously opened tab.
PaneGroup.prototype.switchPane = function(tabName) {
    if (this.activePane && tabName === this.activePane.tabName) return;
    
    const toSwitchTo = tabName ?
              this.panes.find(e => e.tabName === tabName) :
              this.prevActivePane;

    if (!toSwitchTo) return;
    
    if (this.activePane) {
        this.activePane.hide();
    }

    this.prevActivePane = this.activePane;
    this.activePane = toSwitchTo;
    this.activePane.show();
    this.activePane.setActive();

    this.tabBar.setSelected(this.activePane.tabName);
    this.onSwitchPane(this.activePane);
};

// If tabName is undefined, closes the active tab.
PaneGroup.prototype.closePane = function(_tabName) {
    if (!_tabName && !this.activePane) return;

    const tabName = _tabName || this.activePane.tabName;
    const paneIndex = this.panes.findIndex(e => e.tabName === tabName);
    const pane = this.panes.splice(paneIndex, 1)[0];

    this.tabBar.remove(pane.tabName);
    this.domNode.removeChild(pane.domNode);
    
    if (pane === this.activePane) {
        this.activePane = null;
        this.switchPane();
    } else if (pane === this.prevActivePane) {
        this.prevActivePane = null;
    }

    // We lose the prevActivePane when either the activePane or prevActivePane is closed.
    if (!this.prevActivePane) {
        this.prevActivePane = this.panes.find(e => e !== this.activePane) || null;
    }

    if (this.panes.length === 0) {
        this.noPanesKeyListener.attach();
    }

    this.onClosePane();
};

PaneGroup.prototype.closeAllPanes = function() {
    this.panes.forEach(e => {
        this.tabBar.remove(e.tabName);
        this.domNode.removeChild(e.domNode);
    });
    this.panes = [];
    this.activePane = null;
    this.prevActivePane = null;
    this.noPanesKeyListener.attach();
};

PaneGroup.prototype.splitUp = function() {
    const height = Math.round(this.getHeight() / 2);
    const width = this.getWidth();
    const topOffset = this.getTopOffset() + height;
    const leftOffset = this.getLeftOffset();
    const neighbors = Object.assign({}, this.neighbors, {up: this});

    const group = this._makeGroup(height, width, topOffset, leftOffset, neighbors);
    
    this.setHeight(height);
    this.neighbors.down = group;
    this.onSplit(group);
};

PaneGroup.prototype.splitDown = function() {
    const height = Math.round(this.getHeight() / 2);
    const width = this.getWidth();
    const topOffset = this.getTopOffset();
    const leftOffset = this.getLeftOffset();
    const neighbors = Object.assign({}, this.neighbors, {down: this});

    const group = this._makeGroup(height, width, topOffset, leftOffset, neighbors);
    
    this.setHeight(height);
    this.setTopOffset(topOffset + height);
    this.neighbors.up = group;
    this.onSplit(group);
};

PaneGroup.prototype.splitLeft = function() {
    const height = this.getHeight();
    const width = Math.round(this.getWidth() / 2);
    const topOffset = this.getTopOffset();
    const leftOffset = this.getLeftOffset() + width;
    const neighbors = Object.assign({}, this.neighbors, {left: this});

    const group = this._makeGroup(height, width, topOffset, leftOffset, neighbors);
    
    this.setWidth(width);
    this.neighbors.right = group;
    this.onSplit(group);
};

PaneGroup.prototype.splitRight = function() {
    const height = this.getHeight();
    const width = Math.round(this.getWidth() / 2);
    const topOffset = this.getTopOffset();
    const leftOffset = this.getLeftOffset();
    const neighbors = Object.assign({}, this.neighbors, {right: this});

    const group = this._makeGroup(height, width, topOffset, leftOffset, neighbors);
    
    this.setWidth(width);
    this.setLeftOffset(leftOffset + width);
    this.neighbors.left = group;
    this.onSplit(group);
};

PaneGroup.prototype.showTabBar = function() {
    if (!this.tabBar.isVisible()) {
        this.tabBar.show();
        this.panes.forEach(e => e.setTopOffset(this.tabBar.getVisibleHeight()));
        this._resizePanes();
    }
};

PaneGroup.prototype.hideTabBar = function() {
    if (this.tabBar.isVisible()) {
        this.tabBar.hide();
        this.panes.forEach(e => e.setTopOffset(0));
        this._resizePanes();
    }
};

PaneGroup.prototype.setActive = function() {
    if (this.activePane) {
        this.activePane.setActive();
        this.tabBar.setActive();
    } else {
        this.domNode.focus();
    }
};

PaneGroup.prototype.setInactive = function() {
    if (this.activePane) {
        this.activePane.setInactive();
        this.tabBar.setInactive();
    } else {
        this.domNode.blur();
    }
};

PaneGroup.prototype.show = function() {
    this.domNode.classList.remove('hidden');
};

PaneGroup.prototype.hide = function() {
    this.domNode.classList.add('hidden');
};

PaneGroup.prototype.getPaneCount = function() {
    return this.panes.length;
};

PaneGroup.prototype.setHeight = function(to) {
    this.domNode.style.height = to + 'px';
    this._resizePanes();
};

PaneGroup.prototype.getHeight = function() {
    const height = parseInt(this.domNode.style.height);
    if (height == null) {
        throw new Error('PaneGroup: Unable to parse height.');
    }
    return height;
};

PaneGroup.prototype.setWidth = function(to) {
    this.domNode.style.width = to + 'px';
    this._resizePanes();
};

PaneGroup.prototype.getWidth = function() {
    const width = parseInt(this.domNode.style.width);
    if (width == null) {
        throw new Error('PangeGroup: Unable to parse width.');
    }
    return width;
};

PaneGroup.prototype.setTopOffset = function(to) {
    this.domNode.style.top = to + 'px';
};

PaneGroup.prototype.getTopOffset = function() {
    const offset = parseInt(this.domNode.style.top);
    if (offset == null) {
        throw new Error('PaneGroup: Unable to parse topOffset.');
    }
    return offset;
};

PaneGroup.prototype.setLeftOffset = function(to) {
    this.domNode.style.left = to + 'px';
};

PaneGroup.prototype.getLeftOffset = function() {
    const offset = parseInt(this.domNode.style.left);
    if (offset == null) {
        throw new Error('PaneGroup: Unable to parse leftOffset.');
    }
    return offset;
};

PaneGroup.prototype._resizePanes = function() {
    if (!this.activePane) return;
    
    const panesHeight = this.getHeight() - this.tabBar.getVisibleHeight();
    const panesWidth = this.getWidth();

    if (this.activePane.getHeight() !== panesHeight) {
        this.panes.forEach(e => e.setHeight(panesHeight));    
    }
    if (this.activePane.getWidth() !== panesWidth) {
        this.panes.forEach(e => e.setWidth(panesWidth));    
    }    
};

// Returns a new pane group whose settings are the result of merging this group's settings
// with the fields given.
PaneGroup.prototype._makeGroup = function(height, width, topOffset, leftOffset, neighbors) {
    return new PaneGroup(this.parentElem, {
        keyMaps: this.keyMaps,
        height,
        width,
        topOffset,
        leftOffset,
        neighbors,
        sharedEditorComponentSettings: this.sharedEditorComponentSettings,
        onUnknownAction: this.onUnknownAction,
        onCursorMoved: this.onCursorMoved,
        onNewPane: this.onNewPane,
        onSwitchPane: this.onSwitchPane,
        onClosePane: this.onClosePane,
        onFocused: this.onFocused,
        onSplit: this.onSplit
    });
};

// If an editor pane exists with the same name as that given, returns a unique
// version of the name of the form `name-{Unique Number}`. Otherwise, returns the given name.
PaneGroup.prototype._getUniqueTabName = function(name) {    
    const suffixNum = this.panes.reduce((prev, curr) => {
        if (prev === 0 && curr.tabName === name) {
            return prev + 1;
        }
        if (prev > 0) {
            // untitled-1 -> untitled
            const sansSuffix = curr.tabName.slice(0, curr.tabName.length - numDigitsIn(prev) - 1);
            if (sansSuffix === name) {
                return prev + 1;   
            }
        }

        return prev;
    }, 0);

    return suffixNum === 0 ? name : name + '-' + suffixNum;
};

PaneGroup.prototype._handleAction = function(action) {

    const actionHandlers = {
        'NEW_PANE':               (action) => this.newPane(action.name),
        'SWITCH_PANE':            (action) => this.switchPane(action.name),
        'CLOSE_PANE':             (action) => this.closePane(action.name),
        'SPLIT_PANE_GROUP_UP':    () => this.splitUp(),
        'SPLIT_PANE_GROUP_DOWN':  () => this.splitDown(),
        'SPLIT_PANE_GROUP_LEFT':  () => this.splitLeft(),
        'SPLIT_PANE_GROUP_RIGHT': () => this.splitRight(),
        'CLOSE_ALL':              () => this.closeAllPanes(),
        'SHOW_TABS':              () => this.showTabBar(),
        'HIDE_TABS':              () => this.hideTabBar()
    };
    
    const handler = actionHandlers[action.type];

    if (handler) {
        handler(action);
    } else {
        this.onUnknownAction(action);
    }
};

module.exports = PaneGroup;