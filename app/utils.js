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

// num must be positive and contains no more than 8 digits.
function numDigitsIn(num) {
    const abs = Math.abs(num);
    if (abs < 10) return 1;
    if (abs < 100) return 2;
    if (abs < 1000) return 3;
    if (abs < 10000) return 4;
    if (abs < 100000) return 5;
    if (abs < 1000000) return 6;
    if (abs < 10000000) return 7;
    if (abs < 100000000) return 8;
    
    throw new Error('utils: Given num is too big: ' + num);
};

module.exports = {
    getSharedViewSettings,
    numDigitsIn
};
