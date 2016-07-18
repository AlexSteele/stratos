'use strict';

function getSharedViewSettings(elem) {
    const [defaultCharWidth, defaultCharHeight] = measureCharWidthAndHeight(elem);
    return {
        charWidth: defaultCharWidth,
        charHeight: defaultCharHeight
    };
};

// Returns a tuple of the average default character width and height (in pixels).
function measureCharWidthAndHeight(elem) {
    const line = document.createElement('span');
    line.className = 'line';
    line.innerHTML = 'a';
    line.style.position = 'absolute';
    line.style.height = 'auto';
    line.style.width = 'auto';
    line.style['white-space'] = 'nowrap';
    line.style.visibility = 'hidden';
    elem.appendChild(line);
    const bounds = line.getBoundingClientRect();
    const width = bounds.width;
    const height = bounds.height;
    elem.removeChild(line);
    return [width, height];
};

module.exports = {
    getSharedViewSettings
};
