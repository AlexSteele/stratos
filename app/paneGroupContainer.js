'use strict';

const PaneGroup = require('./paneGroup.js');

const defaults = {
    height: 0,
    width: 0,
    paneGroupSettings: {},
    onUnknownAction: (action) => { throw new Error('PaneGroupContainer: No handler for onUnknownAction.'); }
};

function PaneGroupContainer(parentElem, settings = defaults) {

    this.parentElem = parentElem;
    this.height = settings.height || defaults.height;
    this.width = settings.width || defaults.width;
    this.onUnknownAction = settings.onUnknownAction || defaults.onUnknownAction;
    
    const paneGroupSettings = settings.paneGroupSettings || defaults.paneGroupSettings;
    this.paneGroupSettings = Object.assign({}, paneGroupSettings, {
        onUnknownAction: (action) => this._handleAction(action),
        onFocus: (paneGroup) => {
            if (this.activeGroup) {
                this.activeGroup.setInactive();
            }
            this.activeGroup = paneGroup;
            this.activeGroup.setActive();
        }    
    });

    // Add first PaneGroup.
    const dims = {height: this.height, width: this.width, topOffset: 0, leftOffset: 0}; 
    const firstGroupSettings = Object.assign({}, this.paneGroupSettings, dims);
    this.activeGroup = new PaneGroup(this.parentElem, firstGroupSettings);
    this.paneGroups = [this.activeGroup];

    this.activeGroup.setActive();
};

PaneGroupContainer.prototype.switchUpGroup = function() {
    return this._switchGroup('above');
};

PaneGroupContainer.prototype.switchDownGroup = function() {
    return this._switchGroup('below');
};

PaneGroupContainer.prototype.switchLeftGroup = function() {
    return this._switchGroup('left');
};

PaneGroupContainer.prototype.switchRightGroup = function() {
    return this._switchGroup('right');
};

// Where direction is 'above', 'below', 'left', or 'right'.
PaneGroupContainer.prototype._switchGroup = function(direction) {
    const neighbor = this.activeGroup.neighbors[direction];
    
    if (!neighbor) return;
    
    this.activeGroup.setInactive();
    neighbor.setActive();
    this.activeGroup = neighbor;
};

// Places the active group in the upper half of its currently occupied area
// and the new group in the lower half.
PaneGroupContainer.prototype.splitUp = function() {
    if (!this.activeGroup) return;
    
    const height = Math.round(this.activeGroup.getHeight() / 2);
    const width = this.activeGroup.getWidth();
    const topOffset = this.activeGroup.getTopOffset() + height;
    const leftOffset = this.activeGroup.getLeftOffset();
    const neighbors = Object.assign({}, this.activeGroup.neighbors);
    const settings =  {height, width, topOffset, leftOffset, neighbors};
    const mergedSettings = Object.assign({}, this.paneGroupSettings, settings);
    const newGroup = new PaneGroup(this.parentElem, mergedSettings);
    this.paneGroups.push(newGroup);
    
    this.activeGroup.setHeight(this.activeGroup.getHeight() - height);

    // Update neighbor pointers.

    // above/below 
    this.activeGroup.neighbors.below = newGroup;
    newGroup.neighbors.above = this.activeGroup;
    newGroup.getNeighbors('below').forEach(e => e.neighbors.above = newGroup);

    // left/right
    newGroup.neighbors.left = newGroup.getFirstFullNeighbor('left') || newGroup.neighbors.left;
    newGroup.neighbors.right = newGroup.getFirstFullNeighbor('right') || newGroup.neighbors.right;
    this.activeGroup.getNeighbors('left').forEach(e => e.neighbors.right = e.getFirstFullNeighbor('right') || e.neighbors.right);
    this.activeGroup.getNeighbors('right').forEach(e => e.neighbors.left = e.getFirstFullNeighbor('left') || e.neighbors.right);
};

// Places the active group in the lower half of its currently occupied area
// and the new group in the upper half.
PaneGroupContainer.prototype.splitDown = function() {
    if (!this.activeGroup) return;
    
    const height = Math.round(this.activeGroup.getHeight() / 2);
    const width = this.activeGroup.getWidth();
    const topOffset = this.activeGroup.getTopOffset();
    const leftOffset = this.activeGroup.getLeftOffset();
    const neighbors = Object.assign({}, this.activeGroup.neighbors);
    const settings =  {height, width, topOffset, leftOffset, neighbors};
    const mergedSettings = Object.assign({}, this.paneGroupSettings, settings);
    const newGroup = new PaneGroup(this.parentElem, mergedSettings);
    this.paneGroups.push(newGroup);

    this.activeGroup.setHeight(this.activeGroup.getHeight() - height);
    this.activeGroup.setTopOffset(topOffset + height);

    // above/below
    this.activeGroup.neighbors.above = newGroup;
    newGroup.neighbors.below = this.activeGroup;
    newGroup.getNeighbors('above').forEach(e => e.neighbors.below = newGroup);

    // left/right
    this.activeGroup.neighbors.left = this.activeGroup.getFirstFullNeighbor('left') || this.activeGroup.neighbors.left;
    this.activeGroup.neighbors.right = this.activeGroup.getFirstFullNeighbor('right') || this.activeGroup.neighbors.right;
    newGroup.getNeighbors('left').forEach(e => e.neighbors.right = e.getFirstFullNeighbor('right') || e.neighbors.right);
    newGroup.getNeighbors('right').forEach(e => e.neighbors.left = e.getFirstFullNeighbor('left') || e.neighbors.left);
};

// Places the active group in the left half of its currently occupied area
// and the new group in the right half.
PaneGroupContainer.prototype.splitLeft = function() {
    if (!this.activeGroup) return;
    
    const height = this.activeGroup.getHeight();
    const width = Math.round(this.activeGroup.getWidth() / 2);
    const topOffset = this.activeGroup.getTopOffset();
    const leftOffset = this.activeGroup.getLeftOffset() + width;
    const neighbors = Object.assign({}, this.activeGroup.neighbors);
    const settings =  {height, width, topOffset, leftOffset, neighbors};
    const mergedSettings = Object.assign({}, this.paneGroupSettings, settings);
    const newGroup = new PaneGroup(this.parentElem, mergedSettings);
    this.paneGroups.push(newGroup);
    
    this.activeGroup.setWidth(this.activeGroup.getWidth() - width);

    // left/right
    this.activeGroup.neighbors.right = newGroup;
    newGroup.neighbors.left = this.activeGroup;
    newGroup.getNeighbors('right').forEach(e => e.neighbors.left = newGroup);

    // above/below
    newGroup.neighbors.above = newGroup.getFirstFullNeighbor('above') || newGroup.neighbors.above;
    newGroup.neighbors.below = newGroup.getFirstFullNeighbor('below') || newGroup.neighbors.below;
    this.activeGroup.getNeighbors('above').forEach(e => e.neighbors.below = e.getFirstFullNeighbor('below') || e.neighbors.below);
    this.activeGroup.getNeighbors('below').forEach(e => e.neighbors.above = e.getFirstFullNeighbor('above') || e.neighbors.above);
};

// Places the active group in the right half of its currently occupied area
// and the new group in the left half.
PaneGroupContainer.prototype.splitRight = function() {
    if (!this.activeGroup) return;
    
    const height = this.activeGroup.getHeight();
    const width = Math.round(this.activeGroup.getWidth() / 2);
    const topOffset = this.activeGroup.getTopOffset();
    const leftOffset = this.activeGroup.getLeftOffset();
    const neighbors = Object.assign({}, this.activeGroup.neighbors);
    const settings =  {height, width, topOffset, leftOffset, neighbors};
    const mergedSettings = Object.assign({}, this.paneGroupSettings, settings);
    const newGroup = new PaneGroup(this.parentElem, mergedSettings);
    this.paneGroups.push(newGroup);
    
    this.activeGroup.setWidth(this.activeGroup.getWidth() - width);
    this.activeGroup.setLeftOffset(leftOffset + width);

    // left/right
    this.activeGroup.neighbors.left = newGroup;
    newGroup.neighbors.right = this.activeGroup;
    newGroup.getNeighbors('left').forEach(e => e.neighbors.right = newGroup);

    // above/below
    this.activeGroup.neighbors.above = this.activeGroup.getFirstFullNeighbor('above') || this.activeGroup.neighbors.above;
    this.activeGroup.neighbors.below = this.activeGroup.getFirstFullNeighbor('below') || this.activeGroup.neighbors.below;
    newGroup.getNeighbors('above').forEach(e => e.neighbors.below = e.getFirstFullNeighbor('below') || e.neighbors.below);
    newGroup.getNeighbors('below').forEach(e => e.neighbors.above = e.getFirstFullNeighbor('above') || e.neighbors.above);
};

PaneGroupContainer.prototype.closeGroup = function() {
    if (!this.activeGroup || this.paneGroups.length === 1) return;

    // Find a set of neighbors who share an exact border (fit squarely) with the active group.
    // At least one set of neighbors must satisfy this criteria.
    const fitSquarelyAboveOrBelow = (neighbors) => neighbors.length > 0 &&
              neighbors[0].getLeftOffset() === this.activeGroup.getLeftOffset() &&
              neighbors[neighbors.length - 1].getRightOffset() === this.activeGroup.getRightOffset();
    
    const fitSquarelyBeside = (neighbors) =>  neighbors.length > 0 &&
              neighbors[0].getTopOffset() === this.activeGroup.getTopOffset() &&
              neighbors[neighbors.length - 1].getBottomOffset() === this.activeGroup.getBottomOffset();

    const fitSquarely = ({side, neighbors}) => (side === 'above' || side === 'below') ?
              fitSquarelyAboveOrBelow(neighbors) :
              fitSquarelyBeside(neighbors);
    
    const {side, neighbors} = ['above', 'right', 'below', 'left'].
              map(side => ({side, neighbors: this.activeGroup.getNeighbors(side)})).
              find(neighbors => fitSquarely(neighbors));

    // Update their dimensions, offsets, and neighbors to take the active group's space.
    switch (side) {
    case 'above':
        // Update dimensions.
        neighbors.forEach(e => e.setHeight(e.getHeight() + this.activeGroup.getHeight()));

        // Update neighbors.
        neighbors.forEach(e => e.neighbors.below = this.activeGroup.getNeighbors('below').find(n => e.doesShareBorder(n, 'below')));
        this.activeGroup.getNeighbors('below').
            filter(e => e.neighbors.above === this.activeGroup).
            forEach(e => e.neighbors.above = neighbors.find(n => e.doesShareBorder(n, 'above')));   
        this.activeGroup.getNeighbors('left').
            filter(e => e.neighbors.right === this.activeGroup).
            forEach(e => e.neighbors.right = neighbors[0]);
        this.activeGroup.getNeighbors('right').
            filter(e => e.neighbors.left === this.activeGroup).
            forEach(e => e.neighbors.left = neighbors[neighbors.length - 1]);             
        break;
    case 'right':
        // Update dimensions.
        neighbors.forEach(e => {
            e.setLeftOffset(this.activeGroup.getLeftOffset());
            e.setWidth(e.getWidth() + this.activeGroup.getWidth());
        });

        // Update neighbors.
        this.activeGroup.getNeighbors('above').
            filter(e => e.neighbors.below === this.activeGroup).
            forEach(e => e.neighbors.below = neighbors[0]);
        this.activeGroup.getNeighbors('below').
            filter(e => e.neighbors.above === this.activeGroup).
            forEach(e => e.neighbors.above = neighbors[neighbors.length - 1]);
        this.activeGroup.getNeighbors('left').
            filter(e => e.neighbors.right === this.activeGroup).
            forEach(e => e.neighbors.right = neighbors.find(n => e.doesShareBorder(n, 'right')));
        neighbors.forEach(e => e.neighbors.left = this.activeGroup.getNeighbors('left').find(n => e.doesShareBorder(n, 'left')));
        break;
    case 'below':
        // Update dimensions.
        neighbors.forEach(e => {
            e.setTopOffset(this.activeGroup.getTopOffset());
            e.setHeight(e.getHeight() + this.activeGroup.getHeight());
        });

        // Update neighbors.
        this.activeGroup.getNeighbors('above').
            filter(e => e.neighbors.below === this.activeGroup).
            forEach(e => e.neighbors.below = neighbors.find(n => e.doesShareBorder(n, 'below')));
        neighbors.forEach(e => e.neighbors.above = this.activeGroup.getNeighbors('above').find(n => e.doesShareBorder(n, 'above')));
        this.activeGroup.getNeighbors('left').
            filter(e => e.neighbors.right === this.activeGroup).
            forEach(e => e.neighbors.right = neighbors[0]);
        this.activeGroup.getNeighbors('right').
            filter(e => e.neighbors.left === this.activeGroup).
            forEach(e => e.neighbors.left = neighbors[neighbors.length - 1]);
        
        break;
    case 'left':
        // Update dimensions.
        neighbors.forEach(e => e.setWidth(e.getWidth() + this.activeGroup.getWidth()));

        // Update neighbors.
        this.activeGroup.getNeighbors('above').
            filter(e => e.neighbors.below === this.activeGroup).
            forEach(e => e.neighbors.below = neighbors[0]);
        this.activeGroup.getNeighbors('below').
            filter(e => e.neighbors.above === this.activeGroup).
            forEach(e => e.neighbors.above = neighbors[neighbors.length - 1]);
        neighbors.forEach(e => e.neighbors.right = this.activeGroup.getNeighbors('right').find(n => e.doesShareBorder(n, 'right')));
        this.activeGroup.getNeighbors('right').
            filter(e => e.neighbors.left === this.activeGroup).
            forEach(e => e.neighbors.left = neighbors.find(n => e.doesShareBorder(n, 'left')));        
        break;
    };

    // Remove the active group.
    this.paneGroups.splice(this.paneGroups.findIndex(e => e === this.activeGroup), 1);
    this.parentElem.removeChild(this.activeGroup.domNode);

    // Set one of the neighbors as the active group.
    this.activeGroup = neighbors[0];
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
    //this.paneGroups.forEach(e => e.setHeight(to)); // TODO: fix
    this.height = to;
};

PaneGroupContainer.prototype.getHeight = function() {
    return this.height;
};

PaneGroupContainer.prototype.setWidth = function(to) {
    //this.paneGroups.forEach(e => e.setWidth(to)); // TODO: fix
    this.width = to;
};

PaneGroupContainer.prototype.getWidth = function() {
    return this.width;
};

PaneGroupContainer.prototype._handleAction = function(action) {

    const handlers = {
        'SWITCH_PANE_GROUP_UP':    () => this.switchUpGroup(),
        'SWITCH_PANE_GROUP_DOWN':  () => this.switchDownGroup(),
        'SWITCH_PANE_GROUP_LEFT':  () => this.switchLeftGroup(),
        'SWITCH_PANE_GROUP_RIGHT': () => this.switchRightGroup(),
        'SPLIT_PANE_GROUP_UP':     () => this.splitUp(),
        'SPLIT_PANE_GROUP_DOWN':   () => this.splitDown(),
        'SPLIT_PANE_GROUP_LEFT':   () => this.splitLeft(),
        'SPLIT_PANE_GROUP_RIGHT':  () => this.splitRight(),
        'CLOSE_PANE_GROUP':        () => this.closeGroup()
    };

    const handler = handlers[action.type];

    if (handler) {
        handler(action);
    } else {
        this.onUnknownAction(action);
    }
};

module.exports = PaneGroupContainer;
