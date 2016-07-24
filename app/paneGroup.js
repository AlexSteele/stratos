'use strict';

const EditorPane = require('./editorPane.js');
const KeyListener = require('./keyListener.js');
const {numDigitsIn} = require('./utils.js');
const TabBar = require('./tabBar.js');

const defaults = {
    keyMaps: {},
    height: '100%',
    width: '100%',
    sharedEditorComponentSettings: {},
    onUnknownAction: (action) => { throw new Error('PaneGroup: No handler for action ' + action); },
    onCursorMoved: (line, col) => { throw new Error('PaneGroup: No handler for onCursorMoved.'); },
    onNewPane: () => { throw new Error('PaneGroup: No handler for onNewPane.'); },
    onSwitchPane: (newActivePane) => { throw new Error('PaneGroup: No handler for onSwitchPane.'); },
    onClosePane: () => { throw new Error('PaneGroup: No handler for onClosePane.'); }
};

function PaneGroup(parentElem, settings = defaults) {

    this.keyMaps = settings.keyMaps || defaults.keyMaps;
    this.panes = [];
    this.activePane = null;
    this.prevActivePane = null;
    
    this.domNode = document.createElement('div');
    this.domNode.className = 'pane-group';
    this.domNode.style.height = settings.height || defaults.height;
    this.domNode.style.width = settings.width || defaults.width;
    parentElem.appendChild(this.domNode);

    this.onUnknownAction = settings.onUnknownAction || defaults.onUnknownAction;
    this.onCursorMoved = settings.onCursorMoved || defaults.onCursorMoved;
    this.onNewPane = settings.onNewPane || defaults.onNewPane;
    this.onSwitchPane = settings.onSwitchPane || defaults.onSwitchPane;
    this.onClosePane = settings.onClosePane || defaults.onClosePane;
        
    // These are used when instantiating editorPane instances.
    this.sharedEditorComponentSettings = settings.sharedEditorComponentSettings || defaults.sharedEditorComponentSettings;

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
};

PaneGroup.prototype.newPane = function(name = 'untitled') {
    const tabName = this._getUniqueTabName(name);
    const tabsHeight = this.tabBar.getVisibleHeight();
    const paneHeight = this.getHeight() - tabsHeight;
    const pane = new EditorPane(this.domNode, {
        name: name,
        tabName: tabName,
        keyMap: this.keyMaps['editor-default'],
        height: paneHeight,
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

PaneGroup.prototype._handleAction = function(action) {

    const actionHandlers = {
        'NEW_PANE':    (action) => this.newPane(action.name),
        'SWITCH_PANE': (action) => this.switchPane(action.name),
        'CLOSE_PANE':  (action) => this.closePane(action.name),
        'CLOSE_ALL':  () => this.closeAllPanes(),
        'SHOW_TABS':  () => this.showTabBar(),
        'HIDE_TABS':  () => this.hideTabBar()
    };
    
    const handler = actionHandlers[action.type];

    if (handler) {
        handler(action);
    } else {
        this.onUnknownAction(action);
    }
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

module.exports = PaneGroup;
