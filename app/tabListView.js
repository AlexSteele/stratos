'use strict';

const defaults = {
    tabsLeftOffset: 30,
    onTabClick: (tabName) => { throw new Error('TabListView: No handler for onTabClick'); }
};

function TabListView(parentElem, settings = defaults) {
    this.tabsLeftOffset = settings.tabsLeftOffset || defaults.tabsLeftOffset;
    this.onTabClick = settings.onTabClick || defaults.onTabClick;

    this.tabViews = [];
    this.selectedTab = null;

    this.domNode = document.createElement('div');
    this.domNode.className = 'tab-list';

    parentElem.appendChild(this.domNode);
}

TabListView.prototype.add = function(tabName) {
    const tab = new TabView(this.domNode, {
        name: tabName,
        onClick: this.onTabClick
    });
    this.tabViews.push(tab);
    tab.setLeftOffset(this.tabsLeftOffset);
};

TabListView.prototype.remove = function(tabName) {
    const index = this.tabViews.findIndex(e => e.getName() === tabName);
    if (index === -1) throw new Error('TabListView: No tab with name ' + tabName);
    const tab = this.tabViews.splice(index, 1)[0];
    this.domNode.removeChild(tab.domNode);
    return true;
};

TabListView.prototype.setSelected = function(tabName) {
    const toSelect = this.tabViews.find(e => e.getName() === tabName);

    if (!toSelect) throw new Error('TabListView: No tab with name ' + tabName);

    if (this.selectedTab) {
        this.selectedTab.setSelected(false);
    }

    this.selectedTab = toSelect;
    this.selectedTab.setSelected(true);

    return true;
};

TabListView.prototype.getHeight = function() {
    const height = parseInt(this.domNode.style.height) || this.domNode.scrollHeight;
    if (!height) {
        throw new Error('TabListView: Unable to parse height.');
    }
    return height;
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

TabView.prototype.getName = function() {
    return this.tabNameNode.innerHTML;
};

TabView.prototype.getWidth = function() {
    const width = parseInt(this.domNode.style.width) || this.domNode.scrollWidth;
    if (!width) {
        throw new Error('TabView: Unable to parse width.');
    }
    return width;
};

module.exports.TabListView = TabListView;
