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
    this._validatePosSoft(lineNum, col);
    
    const line = this.lines[lineNum];
    const before = line.slice(0, col);
    const after = line.slice(col);
    this.lines[lineNum] = before + text + after;
};

// For convenience, lineNum may equal the number of lines in the model,
// in which case col is ignored.
BufferModel.prototype.insertNewLine = function(lineNum, col) {
    if (lineNum === this.lines.length) {
        this.appendLine();
    }

    this._validatePosSoft(lineNum, col);

    const line = this.lines[lineNum];
    const before = line.substr(0, col);
    const after = line.substr(col);
    this.lines[lineNum] = before;
    this.lines.splice(lineNum + 1, 0, after);
};

BufferModel.prototype.setLine = function(lineNum, text) {
    this._validateLineNumHard();

    this.lines[lineNum] = text;
};

BufferModel.prototype.deleteBack = function(lineNum, col, amount = 1) {
    this._validatePosSoft(lineNum, col);
    
    const line = this.lines[lineNum];
    const before = line.slice(0, col - amount);
    const after = line.slice(col);
    this.lines[lineNum] = before + after;
};

BufferModel.prototype.deleteForward = function(lineNum, col, amount = 1) {
    this._validatePosSoft(lineNum, col);

    const line = this.lines[lineNum];
    const before = line.slice(0, col);
    const after = line.slice(col + amount);
    this.lines[lineNum] = before + after;
};

BufferModel.prototype.deleteLine = function(lineNum) {
    this._validateLineNumHard(lineNum);

    this.lines.splice(lineNum, 1);
};

BufferModel.prototype.getLine = function(lineNum) {
    this._validateLineNumHard(lineNum);

    return this.lines[lineNum];
};

// TODO: Eventually, these should be determined by the current buffer's `mode`,
// unless simple delimiters don't suffice...
const wordDelimiters = [' ', '.', ',', '-', '/', '!', '?', '"', '\'', '(', ')'];

function isDelimiter(c) {
    return wordDelimiters.some(e => e === c);
}

BufferModel.prototype.getLastWordStart = function(lineNum, col) {
    this._validatePosHard(lineNum, col);
    
    // Regex? Nah

    let l = lineNum,
        c = col - 1; // Start one back from the given column.

    let line = this.lines[l];

    while (true) {
        if (line.length === 0 || c < 0) {
            if (l > 0) {
                l--;
                line = this.lines[l];
                c = line.length - 1;
            } else {
                return [0, 0];   
            }
        } else if (!isDelimiter(line[c])) {
            break;
        } else {
             c--;
        }
    }

    while (c >= 0 && !isDelimiter(line[c])) {
        c--;
    }

    c++;

    return [l, c];
};

BufferModel.prototype.getNextWordEnd = function(lineNum, col) {
    this._validatePosHard(lineNum, col);

    let l = lineNum,
        c = col + 1;

    let line = this.lines[l];

    while (true) {
        if (c >= line.length) {
            if (l < this.lines.length - 1) {
                l++;
                line = this.lines[l];
                c = 0;
            } else {
                return [l, line.length];
            }
        } else if (!isDelimiter(line[c])) {
            break;   
        } else {
            c++;
        }
    }

    while (c < line.length && !isDelimiter(line[c])) {
        c++;
    }

    return [l, c];
};

BufferModel.prototype.clear = function() {
    this.lines = [];
};

BufferModel.prototype._validateLineNumHard = function(lineNum) {
    if (lineNum < 0 || lineNum >= this.lines.length) {
        throw new Error('BufferModel: lineNum out of bounds. Given: ' + lineNum);
    }
};

BufferModel.prototype._validatePosHard = function(lineNum, col) {
    this._validateLineNumHard(lineNum);
    if (col < 0|| col > this.lines[lineNum].length) {
        throw new Error('BufferModel: col out of bounds. Given: ' + col);
    }
};

// lineNum and col may be at the vertical and horizontal bounds of this.lines and
// this.lines[lineNum], respectively.
BufferModel.prototype._validatePosSoft = function(lineNum, col) {
    if (lineNum < 0 || lineNum > this.lines.length) {
        throw new Error('BufferModel: lineNum out of bounds. Given: ' + lineNum);
    }
    if (col < 0 || col > this.lines[lineNum].length) {
        throw new Error('BufferModel: col out of bounds. Given: ' + col);
    }
};

module.exports = BufferModel;
