'use strict';

const {sortRange} = require('./utils.js');

const defaults = {
    onCursorMoved: (line, col) => { throw new Error('MouseListener: No handler for onCursorMoved'); }
};

function MouseListener(bufferView, cursorView, gutterView, settings = defaults) {
    this.bufferView = bufferView;
    this.cursorView = cursorView;
    this.gutterView = gutterView;
    this.onCursorMoved = settings.onCursorMoved || defaults.onCursorMoved;

    // It's important that the mousemove and mouseup listeners be attached to window,
    // not bufferView.domNode, otherwise mousemove will often not fire,
    // and the cursor will continue to track the mouse after the click has been released.

    this.mouseDownPosition = null;

    // Only active when the mouse is down.
    this._onMouseMove = (e) => {
        e.preventDefault();

        window.requestAnimationFrame(() => {
            const [line, col] = this._getBufferPosFromMouse(e.clientX, e.clientY);
            this.cursorView.moveTo(line, col);
            this.gutterView.setActiveLine(this.cursorView.line);
            const [start, end] = sortRange(this.mouseDownPosition, [line, col]);
            this.bufferView.setActiveSelectionRange({start, end});
            this.onCursorMoved(line, col);
        });
    };

    this._onMouseUp = (e) => {
        e.preventDefault();

        this.mouseDownPosition = null;
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
    };

    this._onMouseDown = (e) => {
        e.preventDefault();
      
        this.bufferView.clearActiveSelection();
        this.mouseDownPosition = this._getBufferPosFromMouse(e.clientX, e.clientY);
        const [line, col] = this.mouseDownPosition;
        this.cursorView.moveTo(line, col);
        this.gutterView.setActiveLine(this.cursorView.line);
        window.addEventListener('mouseup', this._onMouseUp);
        window.addEventListener('mousemove', this._onMouseMove);
        this.onCursorMoved(line, col);
    };
}

MouseListener.prototype.setActive = function() {
    this.bufferView.domNode.addEventListener('mousedown', this._onMouseDown);
};

MouseListener.prototype.setInactive = function() {
    this.bufferView.domNode.removeEventListener('mousedown', this._onMouseDown);
};

// Returns a [line, col] tuple.
// If the given coordinates' corresponding line is greater than the last line
// of the buffer, returns the last position in the buffer.
// If the given coordinates' corresponding column is greater than the
// width of their corresponding line, the col returned is the width of the line + 1.
MouseListener.prototype._getBufferPosFromMouse = function(x, y) {
    const bounds = this.bufferView.domNode.getBoundingClientRect();

    const adjustedY = y - bounds.top;
    const line = Math.floor(adjustedY / this.bufferView.charHeight) + 1;
    const lastLine = this.bufferView.getLastLineNum();

    if (line > lastLine) {
        return [lastLine, this.bufferView.getLineWidthCols(lastLine) + 1];
    }

    const adjustedX = x - bounds.left;
    const col = Math.round(adjustedX / this.bufferView.charWidth) + 1;
    const lastCol = this.bufferView.getLineWidthCols(line) + 1;
    const clickCol = Math.min(col, lastCol);
    
    return [line, clickCol];
};

module.exports = MouseListener;
