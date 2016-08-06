'use strict';

const modes = require('./mode.js');
const fs = require('fs');
const path = require('path');

const defaults  = {
    fileName: '',
    mode: modes.default,
    onUnsavedChanges: () => { throw new Error('BufferModel: No handler for onUnsavedChanges.'); },
    onNoUnsavedChanges: () => { throw new Error('BufferModel: No handler for onNoUnsavedChanges.'); }
};

function BufferModel(settings = defaults) {

    // Lines is an array of strings, with each representing a line
    // in the buffer. Line and character access is 0 based.
    this.lines = [];
    this.mode = settings.mode || defaults.mode;
    this.fileName = settings.fileName || defaults.fileName;
    this.unsavedChanges = false;

    this.onUnsavedChanges = settings.onUnsavedChanges || defaults.onUnsavedChanges;
    this.onNoUnsavedChanges = settings.onNoUnsavedChanges || defaults.onNoUnsavedChanges;
};

BufferModel.prototype.appendLine = function(text = '') {
    this.lines.push(text);
    this.unsavedChanges = true;
};

BufferModel.prototype.insert = function(lineNum, col, text) {
    this._validatePosSoft(lineNum, col);
    
    const line = this.lines[lineNum];
    const before = line.slice(0, col);
    const after = line.slice(col);
    this.lines[lineNum] = before + text + after;

    this._onChange();
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

    this._onChange();
};

BufferModel.prototype.setLine = function(lineNum, text) {
    this._validateLineNumHard();

    this.lines[lineNum] = text;

    this._onChange();
};

BufferModel.prototype.deleteBack = function(lineNum, col, amount = 1) {
    this._validatePosSoft(lineNum, col);

    const line = this.lines[lineNum];
    const before = line.slice(0, col - amount);
    const after = line.slice(col);
    this.lines[lineNum] = before + after;

    this._onChange();
};

BufferModel.prototype.deleteForward = function(lineNum, col, amount = 1) {
    this.deleteBack(lineNum, col + amount, amount);
};

BufferModel.prototype.deleteLine = function(lineNum) {
    this._validateLineNumHard(lineNum);
    
    this.lines.splice(lineNum, 1);

    this._onChange();
};

// The range is exclusive: the final character will not be deleted.
// Returns the range of lines deleted, in the form [start, end], where
// start === end signifies no lines were deleted. 
BufferModel.prototype.deleteRange = function(startLine, startCol, endLine, endCol) {
    this._validatePosHard(startLine, startCol);
    this._validatePosHard(endLine, endCol);

    let deletedLineRange;
    if (startLine === endLine) {
        const n = endCol - startCol;
        this.deleteForward(startLine, startCol, n);
        deletedLineRange =  [startLine, startLine];
    } else {
        this.deleteForward(startLine, startCol, this.lines[startLine].length - startCol);
        this.deleteBack(endLine, endCol, endCol);
        this.lines[startLine] = this.lines[startLine] + this.lines[endLine];

        const toDelete = endLine - startLine;
        for (let i = 0; i < toDelete; i++) {
            this.deleteLine(startLine + 1);
        }
        deletedLineRange = [startLine + 1, endLine + 1];
    }

    this._onChange();
    return deletedLineRange;
};

BufferModel.prototype.getLine = function(lineNum) {
    this._validateLineNumHard(lineNum);

    return this.lines[lineNum];
};

BufferModel.prototype.getLastWordStart = function(lineNum, col) {
    this._validatePosHard(lineNum, col);
    
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
        } else if (!this.mode.isWordDelimiter(line[c])) {
            break;
        } else {
             c--;
        }
    }

    while (c >= 0 && !this.mode.isWordDelimiter(line[c])) {
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
        } else if (!this.mode.isWordDelimiter(line[c])) {
            break;   
        } else {
            c++;
        }
    }

    while (c < line.length && !this.mode.isWordDelimiter(line[c])) {
        c++;
    }

    return [l, c];
};

BufferModel.prototype.save = function(as) {
    if (as) {
        this.fileName = as;
    }
    
    if (!this.hasFile()) {
        throw new Error('BufferModel: No file present.');
    }
    
    const text = this.lines.join('\n');
    fs.writeFileSync(this.fileName, text);

    if (this.unsavedChanges) {
        this.unsavedChanges = false;
        this.onNoUnsavedChanges();
    }
};

BufferModel.prototype.reloadFromFile = function() {
    if (!this.hasFile()) {
        throw new Error('BufferModel: No file present.');
    }

    const contents = fs.readFileSync(this.fileName, 'utf8');
    this.lines = contents.split('\n');
};

BufferModel.prototype.getFileBaseName = function() {
    if (!this.hasFile()) {
        throw new Error('BufferModel: No file present.');
    }
    return path.basename(this.fileName);
};

BufferModel.prototype.hasFile = function() {
    return this.fileName !== '';
};

BufferModel.prototype.hasUnsavedChanges = function() {
    return this.unsavedChanges;
};

BufferModel.prototype.getLines = function() {
    return this.lines;
};

BufferModel.prototype.getMode = function() {
    return this.mode;
};

BufferModel.prototype.clear = function() {
    this.lines = [];
};

BufferModel.prototype.isEmpty = function() {
    return this.lines.length === 0;
};

BufferModel.prototype._onChange = function() {
    if (!this.unsavedChanges) {
        this.unsavedChanges = true;
        this.onUnsavedChanges();
    }
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
