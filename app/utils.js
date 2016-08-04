'use strict';

function getSharedEditorComponentSettings(elem) {
    const [charWidth, charHeight] = measureCharWidthAndHeight(elem);
    return {
        charWidth,
        charHeight
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

// Returns the number of _whole_ digits in num (not decimals).
function numDigitsIn(num) {
    const abs = Math.floor(Math.abs(num));
    let numDigits = 1;
    for (let base = 10; base <= abs; base *= 10) {
        numDigits++;
    }
    return numDigits;
};

// Returns the range sorted by line then column, where 'start' and 'end' are two-element arrays. 
function sortRange(start, end) {
    const byLineThenColumn = (start, end) => start[0] === end[0] ? start[1] - end[1] : start[0] - end[0];
    return [start, end].sort(byLineThenColumn);
}

module.exports = {
    getSharedEditorComponentSettings,
    numDigitsIn,
    sortRange
};
