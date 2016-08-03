'use strict';

const defaults = {
    tabsLeftOffset: 30,
    onTabClick: (tabName) => { throw new Error('TabBar: No handler for onTabClick'); }
};

function TabBar(parentElem, settings = defaults) {
    this.tabsLeftOffset = settings.tabsLeftOffset || defaults.tabsLeftOffset;
    this.onTabClick = settings.onTabClick || defaults.onTabClick;

    this.tabViews = [];
    this.selectedTab = null;

    this.domNode = document.createElement('div');
    this.domNode.className = 'tab-list';

    parentElem.appendChild(this.domNode);
}

TabBar.prototype.add = function(tabName) {
    const tab = new TabView(this.domNode, {
        name: tabName,
        onClick: this.onTabClick
    });
    this.tabViews.push(tab);
    tab.setLeftOffset(this.tabsLeftOffset);
};

TabBar.prototype.remove = function(tabName) {
    const index = this.tabViews.findIndex(e => e.getName() === tabName);
    
    if (index === -1) throw new Error('TabBar: No tab with name ' + tabName);
    
    const tab = this.tabViews.splice(index, 1)[0];
    this.domNode.removeChild(tab.domNode);
};

TabBar.prototype.setSelected = function(tabName) {
    const toSelect = this.tabViews.find(e => e.getName() === tabName);

    if (!toSelect) throw new Error('TabBar: No tab with name ' + tabName);

    if (this.selectedTab) {
        this.selectedTab.setSelected(false);
    }

    this.selectedTab = toSelect;
    this.selectedTab.setSelected(true);
};

TabBar.prototype.rename = function(tabName, to) {
    const toRename = this.tabViews.find(e => e.getName() === tabName);

    if (!toRename) throw new Error('TabBar: No tab with name ' + tabName);

    toRename.setName(to);
};

TabBar.prototype.show = function() {
    this.domNode.classList.remove('hidden');
};

TabBar.prototype.hide = function() {
    this.domNode.classList.add('hidden');
};

TabBar.prototype.isVisible = function() {
    return !this.domNode.classList.contains('hidden');  
};

TabBar.prototype.setActive = function() {
    this.domNode.classList.remove('tab-list-inactive');
};

TabBar.prototype.setInactive = function() {
    this.domNode.classList.add('tab-list-inactive');
};

TabBar.prototype.getHeight = function() {
    const height = parseInt(this.domNode.style.height) || this.domNode.scrollHeight;
    if (height == null) {
        throw new Error('TabBar: Unable to parse height.');
    }
    return height;
};

TabBar.prototype.getVisibleHeight = function() {
    return this.isVisible() ? this.getHeight() : 0;
};

// --TabView-----------------

const _defaults = {
    name: 'untitled', 
    onClick: (name) => { throw new Error('TabView: No handler for onClick'); }
};

function TabView(parentElem, settings = _defaults) {
    this.selected = false;
    this.onClick = settings.onClick || _defaults.onClick;

    this.domNode = document.createElement('div');
    this.domNode.className = 'tab';

    this.tabNameNode = document.createElement('div');
    this.tabNameNode.className = 'tab-name';
    this.tabNameNode.innerHTML = settings.name || _defaults.name;
    this.domNode.appendChild(this.tabNameNode);

    this.domNode.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.onClick(this.getName());
    });

    parentElem.appendChild(this.domNode);
}

TabView.prototype.setName = function(name) {
    this.tabNameNode.innerHTML = name;
};

TabView.prototype.getName = function() {
    return this.tabNameNode.innerHTML;
};

TabView.prototype.setLeftOffset = function(to) {
    this.domNode.style.left = to + 'px';
};

TabView.prototype.setSelected = function(on) {
    this.selected = on;
    if (on) {
        this.domNode.classList.add('tab-selected');
    } else {
        this.domNode.classList.remove('tab-selected');
    }
};

TabView.prototype.getWidth = function() {
    const width = parseInt(this.domNode.style.width) || this.domNode.scrollWidth;
    if (width == null) {
        throw new Error('TabView: Unable to parse width.');
    }
    return width;
};

module.exports = TabBar;
