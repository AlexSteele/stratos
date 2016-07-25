'use strict';

const PaneGroup = require('./paneGroup.js');

const defaults = {
    paneGroupSettings: {},
    onUnknownAction: (action) => { throw new Error('PaneGroupContainer: No handler for onUnknownAction.'); }
};

function PaneGroupContainer(parentElem, settings = defaults) {
    
    this.parentElem = parentElem;
    this.paneGroupSettings = settings.paneGroupSettings || defaults.paneGroupSettings;
    this.onUnknownAction = settings.onUnknownAction || defaults.onUnknownAction;

    this.paneGroups = [];
    this.activeGroup = new PaneGroup(this.parentElem, Object.assign({}, this.paneGroupSettings,{
        onUnknownAction: (action) => this._handleAction(action),
        onSplit: (newPaneGroup) => {
            this.paneGroups.push(newPaneGroup);
            newPaneGroup.newPane();

            // TODO: Shouldn't have to do this.
            newPaneGroup.setInactive();
            this.activeGroup.setActive();
        },
        onFocus: (paneGroup) => {
            if (this.activeGroup) {
                this.activeGroup.setInactive();
            }
            this.activeGroup = paneGroup;
            this.activeGroup.setActive();
        }
        
    }));
    this.paneGroups.push(this.activeGroup);
    this.activeGroup.setActive();
};

PaneGroupContainer.prototype.switchUpGroup = function() {
    return this._switchGroup('up');
};

PaneGroupContainer.prototype.switchDownGroup = function() {
    return this._switchGroup('down');
};

PaneGroupContainer.prototype.switchLeftGroup = function() {
    return this._switchGroup('left');
};

PaneGroupContainer.prototype.switchRightGroup = function() {
    return this._switchGroup('right');
};

// Where direction is 'up', 'down', 'left', or 'right'.
PaneGroupContainer.prototype._switchGroup = function(direction) {
    const neighbor = this.activeGroup.neighbors[direction];
    
    if (!neighbor) return;
    
    this.activeGroup.setInactive();
    neighbor.setActive();
    this.activeGroup = neighbor;
};

PaneGroupContainer.prototype.closeGroup = function() {
    if (!this.activeGroup) return;

    const doesShareDimension = (group) => group &&
              (group.getHeight() === this.activeGroup.getHeight() || group.getWidth() === this.activeGroup.getWidth());

    const toSwitchTo = Object.keys(this.activeGroup.neighbors).
              map(e => this.activeGroup.neighbors[e]).
              find(e => doesShareDimension(e));

    if (!toSwitchTo) return;

    if (toSwitchTo.getHeight() === this.activeGroup.getHeight()) {
        toSwitchTo.setWidth(toSwitchTo.getWidth() + this.activeGroup.getWidth());
        toSwitchTo.setLeftOffset(Math.min(this.activeGroup.getLeftOffset(), toSwitchTo.getLeftOffset()));
    }

    if (toSwitchTo.getWidth() === this.activeGroup.getWidth()) {
        toSwitchTo.setHeight(toSwitchTo.getHeight() + this.activeGroup.getHeight());
        toSwitchTo.setTopOffset(Math.min(this.activeGroup.getTopOffset(), toSwitchTo.getTopOffset()));
    }

    this.activeGroup.closeAllPanes();
    this.parentElem.removeChild(this.activeGroup.domNode);
    this.activeGroup = toSwitchTo;
    this.activeGroup.setActive();
};

PaneGroupContainer.prototype.setActive = function() {
    this.activeGroup.setActive();
};

PaneGroupContainer.prototype.setInactive = function() {
    this.activeGroup.setInactive();
};

PaneGroupContainer.prototype.getPaneCount = function() {
    return this.paneGroups.reduce((p, c) => p + c.getPaneCount(), 0);
};

PaneGroupContainer.prototype.setHeight = function(to) {
    this.paneGroups.forEach(e => e.setHeight(to)); // TODO: fix
    this.height = to;
};

PaneGroupContainer.prototype.getHeight = function() {
    return this.height;
};

PaneGroupContainer.prototype.setWidth = function(to) {
    this.paneGroups.forEach(e => e.setWidth(to)); // TODO: fix
    this.width = to;
};

PaneGroupContainer.prototype.getWidth = function() {
    return this.width;
 };

PaneGroupContainer.prototype._handleAction = function(action) {

    const handlers = {
        'SWITCH_PANE_GROUP_UP':        () => this.switchUpGroup(),
        'SWITCH_PANE_GROUP_DOWN':      () => this.switchDownGroup(),
        'SWITCH_PANE_GROUP_LEFT':      () => this.switchLeftGroup(),
        'SWITCH_PANE_GROUP_RIGHT':     () => this.switchRightGroup(),
        'CLOSE_PANE_GROUP':            () => this.closeGroup()
    };

    const handler = handlers[action.type];

    if (handler) {
        handler(action);
    } else {
        this.onUnknownAction(action);
    }
};

module.exports = PaneGroupContainer;
