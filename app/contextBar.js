'use strict';

function ContextBar(parentElem) {
    this.domNode = document.createElement('div');
    this.domNode.className = 'context-bar';
    parentElem.appendChild(this.domNode);

    this.tabNameNode = document.createElement('div');
    this.tabNameNode.className = 'context-bar-widget context-bar-tab-name';
    this.domNode.appendChild(this.tabNameNode);

    this.positionNode = document.createElement('div');
    this.positionNode.className = 'context-bar-widget context-bar-position';
    this.domNode.appendChild(this.positionNode);

    this.unsavedChangesNode = document.createElement('div');
    this.unsavedChangesNode.className = 'context-bar-widget context-bar-unsaved-changes';
    this.domNode.appendChild(this.unsavedChangesNode);

    this.modeNode = document.createElement('div');
    this.modeNode.className = 'context-bar-widget context-bar-mode-name';
    this.domNode.appendChild(this.modeNode);
}

ContextBar.prototype.setTabNameView = function(to) {
    this.tabNameNode.innerHTML = to;
};

ContextBar.prototype.setCursorPositionView = function(line, col) {
    this.positionNode.innerHTML = `Line ${line}, Column ${col}`;
};

ContextBar.prototype.setModeNameView = function(to) {
    this.modeNode.innerHTML = to;
};

ContextBar.prototype.setUnsavedChangesView = function(on) {
    this.unsavedChangesNode.innerHTML = on ? 'U' : 'S';
};

ContextBar.prototype.clear = function() {
    this.tabNameNode.innerHTML = '';
    this.positionNode.innerHTML = '';
    this.modeNode.innerHTML = '';
    this.unsavedChangesNode.innerHTML = '';
};

ContextBar.prototype.setActive = function() {
    this.domNode.classList.remove('context-bar-inactive');    
};

ContextBar.prototype.setInactive = function() {
    this.domNode.classList.add('context-bar-inactive');
};

ContextBar.prototype.show = function() {
    this.domNode.classList.remove('hidden');
};

ContextBar.prototype.hide = function() {
    this.domNode.classList.add('hidden');
};

ContextBar.prototype.isVisible = function() {
    return !this.domNode.classList.contains('hidden');
};

ContextBar.prototype.getHeight = function() {
    return this.domNode.clientHeight;
};

ContextBar.prototype.getVisibleHeight = function() {
    return this.isVisible() ? this.domNode.clientHeight : 0;
};

module.exports = ContextBar;
