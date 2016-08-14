'use strict';

//
//
// TODO: USE FLEXBOX
//
// 

const Pane = require('./pane.js');

const defaults = {
    height: 0,
    width: 0,
    paneSettings: {
        onSwitchEditor: (new_Pane) => { throw new Error('PaneContainer: No handler for onSwitchEditor.'); }
    },
    onUnknownAction: (action) => { throw new Error('PaneContainer: No handler for onUnknownAction.'); }
};

function PaneContainer(parentElem, settings = defaults) {

    this.parentElem = parentElem;
    this.height = settings.height || defaults.height;
    this.width = settings.width || defaults.width;
    this.onUnknownAction = settings.onUnknownAction || defaults.onUnknownAction;

    const paneSettings = settings.paneSettings || defaults.paneSettings;
    this.onSwitchPane = paneSettings.onSwitchPane || defaults.paneSettings.onSwitchPane;
    this.paneSettings = Object.assign({}, paneSettings, {
        onUnknownAction: (action) => this._handleAction(action),
        onFocus: (pane) => {
            if (!this.isActive()) return;
            
            if (this.activePane) {
                this.activePane.setInactive();
            }
            this.activePane = pane;
            this.activePane.setActive();
            this.onSwitchPane(this.activePane.activePane);
        }    
    });

    // Add first Pane.
    const dims = {height: this.height, width: this.width, topOffset: 0, leftOffset: 0}; 
    const firstPaneSettings = Object.assign({}, this.paneSettings, dims);
    this.activePane = new Pane(this.parentElem, firstPaneSettings);
    this.panes = [this.activePane];

    this.activePane.setActive();
};

PaneContainer.prototype.switchPaneAbove = function() {
    return this._switchPane('above');
};

PaneContainer.prototype.switchPaneBelow = function() {
    return this._switchPane('below');
};

PaneContainer.prototype.switchPaneLeft = function() {
    return this._switchPane('left');
};

PaneContainer.prototype.switchPaneRight = function() {
    return this._switchPane('right');
};

// Where direction is 'above', 'below', 'left', or 'right'.
PaneContainer.prototype._switchPane = function(side) {
    if (!this.activePane) return;
    
    const neighbor = this.activePane.neighbors[side];
    
    if (!neighbor) return;
    
    this.activePane.setInactive();
    neighbor.setActive();
    this.activePane = neighbor;
    this.onSwitchPane(this.activePane.activePane);
};

PaneContainer.prototype.swapPaneAbove = function() {
    this._swapPane('above');
};

PaneContainer.prototype.swapPaneBelow = function() {
    this._swapPane('below');
};

PaneContainer.prototype.swapPaneLeft = function() {
    this._swapPane('left');
};

PaneContainer.prototype.swapPaneRight = function() {
    this._swapPane('right');
};

PaneContainer.prototype._swapPane = function(_side) {
    if (!this.activePane) return;
    
    const neighbor = this.activePane.neighbors[_side];

    if (!neighbor) return;
    
    const sidesAndOpposites = [['above', 'below'], ['below', 'above'],
                               ['left', 'right'],  ['right', 'left']];
    
    sidesAndOpposites.forEach(e => {
        const [side, opposite] = e;

        neighbor.getNeighbors(side).
            filter(n => n.neighbors[opposite] === neighbor && n !== this.activePane).
            forEach(n => n.neighbors[opposite] = this.activePane);
        
        this.activePane.getNeighbors(side).
            filter(n => n.neighbors[opposite] === this.activePane && n !== neighbor).
            forEach(n => n.neighbors[opposite] = neighbor);

        const n = this.activePane.neighbors[side];
        this.activePane.neighbors[side] = neighbor.neighbors[side] === this.activePane ? neighbor : neighbor.neighbors[side];
        neighbor.neighbors[side] = n === neighbor ? this.activePane : n;
    });

    const topOffset = this.activePane.getTopOffset();
    const leftOffset = this.activePane.getLeftOffset();
    const height = this.activePane.getHeight();
    const width = this.activePane.getWidth();

    this.activePane.setTopOffset(neighbor.getTopOffset());
    this.activePane.setLeftOffset(neighbor.getLeftOffset());
    this.activePane.setHeight(neighbor.getHeight());
    this.activePane.setWidth(neighbor.getWidth());

    neighbor.setTopOffset(topOffset);
    neighbor.setLeftOffset(leftOffset);
    neighbor.setHeight(height);
    neighbor.setWidth(width);    
};

// Places the active pane in the lower half of its currently occupied area
// and the new pane in the upper half.
PaneContainer.prototype.splitPaneAbove = function() {
    if (!this.activePane) return;
    
    const height = Math.round(this.activePane.getHeight() / 2);
    const width = this.activePane.getWidth();
    const topOffset = this.activePane.getTopOffset();
    const leftOffset = this.activePane.getLeftOffset();
    const neighbors = Object.assign({}, this.activePane.neighbors);
    const settings =  {height, width, topOffset, leftOffset, neighbors};
    const mergedSettings = Object.assign({}, this.paneSettings, settings);
    const newPane = new Pane(this.parentElem, mergedSettings);
    this.panes.push(newPane);

    this.activePane.setHeight(this.activePane.getHeight() - height);
    this.activePane.setTopOffset(topOffset + height);

    // above/below
    this.activePane.neighbors.above = newPane;
    newPane.neighbors.below = this.activePane;
    newPane.getNeighbors('above').forEach(e => e.neighbors.below = newPane);

    // left/right
    this.activePane.neighbors.left = this.activePane.getFirstFullNeighbor('left') || this.activePane.neighbors.left;
    this.activePane.neighbors.right = this.activePane.getFirstFullNeighbor('right') || this.activePane.neighbors.right;
    newPane.getNeighbors('left').forEach(e => e.neighbors.right = e.getFirstFullNeighbor('right') || e.neighbors.right);
    newPane.getNeighbors('right').forEach(e => e.neighbors.left = e.getFirstFullNeighbor('left') || e.neighbors.left);
};

// Places the active pane in the upper half of its currently occupied area
// and the new pane in the lower half.
PaneContainer.prototype.splitPaneBelow = function() {
    if (!this.activePane) return;
    
    const height = Math.round(this.activePane.getHeight() / 2);
    const width = this.activePane.getWidth();
    const topOffset = this.activePane.getTopOffset() + height;
    const leftOffset = this.activePane.getLeftOffset();
    const neighbors = Object.assign({}, this.activePane.neighbors);
    const settings =  {height, width, topOffset, leftOffset, neighbors};
    const mergedSettings = Object.assign({}, this.paneSettings, settings);
    const newPane = new Pane(this.parentElem, mergedSettings);
    this.panes.push(newPane);
    
    this.activePane.setHeight(this.activePane.getHeight() - height);

    // above/below 
    this.activePane.neighbors.below = newPane;
    newPane.neighbors.above = this.activePane;
    newPane.getNeighbors('below').forEach(e => e.neighbors.above = newPane);

    // left/right
    newPane.neighbors.left = newPane.getFirstFullNeighbor('left') || newPane.neighbors.left;
    newPane.neighbors.right = newPane.getFirstFullNeighbor('right') || newPane.neighbors.right;
    this.activePane.getNeighbors('left').forEach(e => e.neighbors.right = e.getFirstFullNeighbor('right') || e.neighbors.right);
    this.activePane.getNeighbors('right').forEach(e => e.neighbors.left = e.getFirstFullNeighbor('left') || e.neighbors.left);
};

// Places the active pane in the right half of its currently occupied area
// and the new pane in the left half.
PaneContainer.prototype.splitPaneLeft = function() {
    if (!this.activePane) return;
    
    const height = this.activePane.getHeight();
    const width = Math.round(this.activePane.getWidth() / 2);
    const topOffset = this.activePane.getTopOffset();
    const leftOffset = this.activePane.getLeftOffset();
    const neighbors = Object.assign({}, this.activePane.neighbors);
    const settings =  {height, width, topOffset, leftOffset, neighbors};
    const mergedSettings = Object.assign({}, this.paneSettings, settings);
    const newPane = new Pane(this.parentElem, mergedSettings);
    this.panes.push(newPane);
    
    this.activePane.setWidth(this.activePane.getWidth() - width);
    this.activePane.setLeftOffset(leftOffset + width);

    // left/right
    this.activePane.neighbors.left = newPane;
    newPane.neighbors.right = this.activePane;
    newPane.getNeighbors('left').forEach(e => e.neighbors.right = newPane);

    // above/below
    this.activePane.neighbors.above = this.activePane.getFirstFullNeighbor('above') || this.activePane.neighbors.above;
    this.activePane.neighbors.below = this.activePane.getFirstFullNeighbor('below') || this.activePane.neighbors.below;
    newPane.getNeighbors('above').forEach(e => e.neighbors.below = e.getFirstFullNeighbor('below') || e.neighbors.below);
    newPane.getNeighbors('below').forEach(e => e.neighbors.above = e.getFirstFullNeighbor('above') || e.neighbors.above);
};

// Places the active pane in the left half of its currently occupied area
// and the new pane in the right half.
PaneContainer.prototype.splitPaneRight = function() {
    if (!this.activePane) return;
    
    const height = this.activePane.getHeight();
    const width = Math.round(this.activePane.getWidth() / 2);
    const topOffset = this.activePane.getTopOffset();
    const leftOffset = this.activePane.getLeftOffset() + width;
    const neighbors = Object.assign({}, this.activePane.neighbors);
    const settings =  {height, width, topOffset, leftOffset, neighbors};
    const mergedSettings = Object.assign({}, this.paneSettings, settings);
    const newPane = new Pane(this.parentElem, mergedSettings);
    this.panes.push(newPane);
    
    this.activePane.setWidth(this.activePane.getWidth() - width);

    // left/right
    this.activePane.neighbors.right = newPane;
    newPane.neighbors.left = this.activePane;
    newPane.getNeighbors('right').forEach(e => e.neighbors.left = newPane);

    // above/below
    newPane.neighbors.above = newPane.getFirstFullNeighbor('above') || newPane.neighbors.above;
    newPane.neighbors.below = newPane.getFirstFullNeighbor('below') || newPane.neighbors.below;
    this.activePane.getNeighbors('above').forEach(e => e.neighbors.below = e.getFirstFullNeighbor('below') || e.neighbors.below);
    this.activePane.getNeighbors('below').forEach(e => e.neighbors.above = e.getFirstFullNeighbor('above') || e.neighbors.above);
};

PaneContainer.prototype.closePane = function() {
    if (!this.activePane || this.panes.length === 1) return;

    // Find a set of neighbors who share an exact border (fit squarely) with the active pane.
    // At least one set of neighbors must satisfy this criteria.
    const fitSquarelyAboveOrBelow = (neighbors) => neighbors.length > 0 &&
              neighbors[0].getLeftOffset() === this.activePane.getLeftOffset() &&
              neighbors[neighbors.length - 1].getRightOffset() === this.activePane.getRightOffset();
    
    const fitSquarelyBeside = (neighbors) =>  neighbors.length > 0 &&
              neighbors[0].getTopOffset() === this.activePane.getTopOffset() &&
              neighbors[neighbors.length - 1].getBottomOffset() === this.activePane.getBottomOffset();

    const fitSquarely = ({side, neighbors}) => (side === 'above' || side === 'below') ?
              fitSquarelyAboveOrBelow(neighbors) :
              fitSquarelyBeside(neighbors);
    
    const {side, neighbors} = ['above', 'right', 'below', 'left'].
              map(side => ({side, neighbors: this.activePane.getNeighbors(side)})).
              find(neighbors => fitSquarely(neighbors));

    // Update their dimensions, offsets, and neighbors to take the active pane's space.
    switch (side) {
    case 'above':
        // Update dimensions.
        neighbors.forEach(e => e.setHeight(e.getHeight() + this.activePane.getHeight()));

        // Update neighbors.
        neighbors.forEach(e => e.neighbors.below = this.activePane.getNeighbors('below').find(n => e.doesShareBorder(n, 'below')));
        this.activePane.getNeighbors('below').
            filter(e => e.neighbors.above === this.activePane).
            forEach(e => e.neighbors.above = neighbors.find(n => e.doesShareBorder(n, 'above')));   
        this.activePane.getNeighbors('left').
            filter(e => e.neighbors.right === this.activePane).
            forEach(e => e.neighbors.right = neighbors[0]);
        this.activePane.getNeighbors('right').
            filter(e => e.neighbors.left === this.activePane).
            forEach(e => e.neighbors.left = neighbors[neighbors.length - 1]);             
        break;
    case 'right':
        // Update dimensions.
        neighbors.forEach(e => {
            e.setLeftOffset(this.activePane.getLeftOffset());
            e.setWidth(e.getWidth() + this.activePane.getWidth());
        });

        // Update neighbors.
        this.activePane.getNeighbors('above').
            filter(e => e.neighbors.below === this.activePane).
            forEach(e => e.neighbors.below = neighbors[0]);
        this.activePane.getNeighbors('below').
            filter(e => e.neighbors.above === this.activePane).
            forEach(e => e.neighbors.above = neighbors[neighbors.length - 1]);
        this.activePane.getNeighbors('left').
            filter(e => e.neighbors.right === this.activePane).
            forEach(e => e.neighbors.right = neighbors.find(n => e.doesShareBorder(n, 'right')));
        neighbors.forEach(e => e.neighbors.left = this.activePane.getNeighbors('left').find(n => e.doesShareBorder(n, 'left')));
        break;
    case 'below':
        // Update dimensions.
        neighbors.forEach(e => {
            e.setTopOffset(this.activePane.getTopOffset());
            e.setHeight(e.getHeight() + this.activePane.getHeight());
        });

        // Update neighbors.
        this.activePane.getNeighbors('above').
            filter(e => e.neighbors.below === this.activePane).
            forEach(e => e.neighbors.below = neighbors.find(n => e.doesShareBorder(n, 'below')));
        neighbors.forEach(e => e.neighbors.above = this.activePane.getNeighbors('above').find(n => e.doesShareBorder(n, 'above')));
        this.activePane.getNeighbors('left').
            filter(e => e.neighbors.right === this.activePane).
            forEach(e => e.neighbors.right = neighbors[0]);
        this.activePane.getNeighbors('right').
            filter(e => e.neighbors.left === this.activePane).
            forEach(e => e.neighbors.left = neighbors[neighbors.length - 1]);
        
        break;
    case 'left':
        // Update dimensions.
        neighbors.forEach(e => e.setWidth(e.getWidth() + this.activePane.getWidth()));

        // Update neighbors.
        this.activePane.getNeighbors('above').
            filter(e => e.neighbors.below === this.activePane).
            forEach(e => e.neighbors.below = neighbors[0]);
        this.activePane.getNeighbors('below').
            filter(e => e.neighbors.above === this.activePane).
            forEach(e => e.neighbors.above = neighbors[neighbors.length - 1]);
        neighbors.forEach(e => e.neighbors.right = this.activePane.getNeighbors('right').find(n => e.doesShareBorder(n, 'right')));
        this.activePane.getNeighbors('right').
            filter(e => e.neighbors.left === this.activePane).
            forEach(e => e.neighbors.left = neighbors.find(n => e.doesShareBorder(n, 'left')));        
        break;
    };

    // Remove the active pane.
    this.panes.splice(this.panes.findIndex(e => e === this.activePane), 1);
    this.parentElem.removeChild(this.activePane.domNode);

    // Set one of the neighbors as the active pane.
    this.activePane = neighbors[0];
    this.activePane.setActive();
};

PaneContainer.prototype.setActive = function() {
    this.activePane.setActive();
};

PaneContainer.prototype.setInactive = function() {
    this.activePane.setInactive();
};

PaneContainer.prototype.isActive =  function() {
    return this.activePane.isActive();
};

PaneContainer.prototype.getEditorCount = function() {
    return this.panes.reduce((p, c) => p + c.getEditorCount(), 0);
};

PaneContainer.prototype.setHeight = function(to) {
    this.panes.forEach(e => {
        const proportion = e.getHeight() / this.height;
        const newHeight = Math.round(proportion * to);
        e.setHeight(newHeight);

        const offsetProportion = e.getTopOffset() / this.height;
        const newOffset = Math.round(offsetProportion * to);
        e.setTopOffset(newOffset);
    });
    this.height = to;
};

PaneContainer.prototype.getHeight = function() {
    return this.height;
};

PaneContainer.prototype.setWidth = function(to) {
    this.panes.forEach(e => {
        const proportion = e.getWidth() / this.width;
        const newWidth = Math.round(proportion * to);
        e.setWidth(newWidth);

        const offsetProportion = e.getLeftOffset() / this.width;
        const newOffset = Math.round(offsetProportion * to);
        e.setLeftOffset(newOffset);
    });
    this.width = to;
};

PaneContainer.prototype.getWidth = function() {
    return this.width;
};

PaneContainer.prototype._handleAction = function(action) {

    const handlers = {
        'SWITCH_PANE_ABOVE': () => this.switchPaneAbove(),
        'SWITCH_PANE_BELOW': () => this.switchPaneBelow(),
        'SWITCH_PANE_LEFT':  () => this.switchPaneLeft(),
        'SWITCH_PANE_RIGHT': () => this.switchPaneRight(),
        'SWAP_PANE_ABOVE':   () => this.swapPaneAbove(),
        'SWAP_PANE_BELOW':   () => this.swapPaneBelow(),
        'SWAP_PANE_LEFT':    () => this.swapPaneLeft(),
        'SWAP_PANE_RIGHT':   () => this.swapPaneRight(),
        'SPLIT_PANE_ABOVE':  () => this.splitPaneAbove(),
        'SPLIT_PANE_BELOW':  () => this.splitPaneBelow(),
        'SPLIT_PANE_LEFT':   () => this.splitPaneLeft(),
        'SPLIT_PANE_RIGHT':  () => this.splitPaneRight(),
        'CLOSE_PANE':        () => this.closePane()
    };

    const handler = handlers[action.type];

    if (handler) {
        handler(action);
    } else {
        this.onUnknownAction(action);
    }
};

module.exports = PaneContainer;
