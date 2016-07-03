
function getSharedViewConfig(domNode) {
    const [defaultCharWidth, defaultCharHeight] = measureCharWidthAndHeight(domNode);
    return {
        charWidth: defaultCharWidth,
        charHeight: defaultCharHeight
    };
};

// Returns a tuple of the average default character width and height (in pixels).
function measureCharWidthAndHeight(domNode) {
    const line = document.createElement('span');
    line.className = 'line';
    line.innerHTML = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV';
    line.style.position = 'absolute';
    line.style.height = 'auto';
    line.style.width = 'auto';
    line.style['whiteSpace'] = 'nowrap'; // TODO: Style attribute may be incorrectly named.
    line.style.visibility = 'hidden';
    domNode.appendChild(line);
    const bounds = line.getBoundingClientRect();
    const width = bounds.width / 52;
    const height = line.offsetHeight;
    domNode.removeChild(line);
    return [width, height];
};

module.exports.viewHelpers = {
    getSharedViewConfig: getSharedViewConfig
};
