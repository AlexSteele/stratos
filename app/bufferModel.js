'use strict';

// This is a minimal, straightforward implementation,
// not a robust or fast one (necessarily). Its semantics
// are a tad sloppy.
function BufferModel() {

    // Lines is an array of strings, with each representing a line
    // in the buffer. Line and character access is 0 based.
    this.lines = [];
};

BufferModel.prototype.appendLine = function(text = '') {
    this.lines.push(text);
};

BufferModel.prototype.insert = function(lineNum, col, text) {
    this._validatePos(lineNum, col);
    
    const line = this.lines[lineNum];
    const before = line.slice(0, col);
    const after = line.slice(col);
    this.lines[lineNum] = before + text + after;
};

// For convenience, lineNum may equal the number of lines in the model,
// in which case col is ignored.
BufferModel.prototype.insertNewLine = function(lineNum, col) {
    if (lineNum === this.lines.length) {
        return this.appendLine();
    }

    this._validatePos(lineNum, col);

    const line = this.lines[lineNum];
    const before = line.substr(0, col);
    const after = line.substr(col);
    this.lines[lineNum] = before;
    this.lines.splice(lineNum + 1, 0, after);
};

BufferModel.prototype.setLine = function(lineNum, text) {
    this._validateLineNum();

    this.lines[lineNum] = text;
};

BufferModel.prototype.deleteBack = function(lineNum, col, amount = 1) {
    this._validatePos(lineNum, col);
    
    const line = this.lines[lineNum];
    const before = line.slice(0, col - amount);
    const after = line.slice(col);
    this.lines[lineNum] = before + after;
};

BufferModel.prototype.deleteForward = function(lineNum, col, amount = 1) {
    this._validatePos(lineNum, col);

    const line = this.lines[lineNum];
    const before = line.slice(0, col);
    const after = line.slice(col + amount);
    this.lines[lineNum] = before + after;
};

BufferModel.prototype.deleteLine = function(lineNum) {
    this._validateLineNum(lineNum);

    this.lines.splice(lineNum, 1);
};

BufferModel.prototype.getLine = function(lineNum) {
    this._validateLineNum(lineNum);

    return this.lines[lineNum];
};

BufferModel.prototype.clear = function() {
    this.lines = [];
};

BufferModel.prototype._validateLineNum = function(lineNum) {
    if (lineNum < 0 || lineNum >= this.lines.length) {
        throw new Error('BufferModel: lineNum out of bounds. Given: ' + lineNum);
    }
};

// lineNum and col may be at the vertical and horizontal bounds of this.lines and
// this.lines[lineNum], respectively.
BufferModel.prototype._validatePos = function(lineNum, col) {
    if (lineNum < 0 || lineNum > this.lines.length) {
        throw new Error('BufferModel: lineNum out of bounds. Given: ' + lineNum);
    }
    if (col < 0 || col > this.lines[lineNum].length) {
        throw new Error('BufferModel: col out of bounds. Given: ' + col);
    }
};

module.exports = BufferModel;
