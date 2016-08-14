'use strict';

const ClipBoard = require('./clipBoard.js');
const modes = require('./mode.js');
const fs = require('fs');
const path = require('path');

const defaults  = {
    fileName: '',
    mode: modes.default,
    clipBoard: {},
    onUnsavedChanges: () => { throw new Error('BufferModel: No handler for onUnsavedChanges.'); },
    onNoUnsavedChanges: () => { throw new Error('BufferModel: No handler for onNoUnsavedChanges.'); }
};

function BufferModel(settings = defaults) {

    // Lines is an array of strings, with each representing a line
    // in the buffer. Line and character access is 0 based.
    this.lines = [];
    this.mode = settings.mode || defaults.mode;
    this.clipBoard = settings.clipBoard || new ClipBoard();
    this.fileName = settings.fileName || defaults.fileName;

    // RegExp of the term currently being searched for with a call to search().
    this.activeSearchTerm = null;
    this.onUnsavedChanges = settings.onUnsavedChanges || defaults.onUnsavedChanges;
    this.onNoUnsavedChanges = settings.onNoUnsavedChanges || defaults.onNoUnsavedChanges;
};

BufferModel.prototype.appendLine = function(text = '') {
    this.lines.push(text);
    this.unsavedChanges = true;
};

BufferModel.prototype.insert = function(lineNum, col, text) {
    this._validatePosHard(lineNum, col);
    
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

// The range excludes [endLine, endCol].
BufferModel.prototype.deleteRange = function(startLine, startCol, endLine, endCol) {
    this._validatePosHard(startLine, startCol);
    this._validatePosHard(endLine, endCol);

    if (startLine === endLine) {
        const n = endCol - startCol;
        this.deleteForward(startLine, startCol, n);
    } else {
        this.deleteForward(startLine, startCol, this.lines[startLine].length - startCol);
        this.deleteBack(endLine, endCol, endCol);
        this.lines[startLine] = this.lines[startLine] + this.lines[endLine];

        const toDelete = endLine - startLine;
        for (let i = 0; i < toDelete; i++) {
            this.deleteLine(startLine + 1);
        }
    }

    this._onChange();
};

BufferModel.prototype.copyRange = function(startLine, startCol, endLine, endCol) {
    const range = this.getRange(startLine, startCol, endLine, endCol);
    this.clipBoard.write(range.join('\n'));
};

// Returns the position of the last character of the pasted text.
BufferModel.prototype.pasteAt = function(startLine, startCol) {
    this._validatePosHard(startLine, startCol);

    const rawClip = this.clipBoard.read();
    
    if (!rawClip) return null;

    const linesToAdd = rawClip.split('\n');
    const beforePaste = this.lines[startLine].slice(0, startCol);
    const afterPaste = this.lines[startLine].slice(startCol);
    
    const endLine = startLine + linesToAdd.length - 1;
    let endCol;
    if (startLine === endLine) {
        endCol = startCol + linesToAdd[0].length;
        this.lines[startLine] = beforePaste + linesToAdd[0] + afterPaste;
    } else {
        endCol = linesToAdd[linesToAdd.length - 1].length;
        this.lines[startLine] = beforePaste + linesToAdd[0];
        for (let i = 1; i < linesToAdd.length; i++) {
            this.lines.splice(startLine + i, 0, linesToAdd[i]);
        }
        this.lines[endLine] += afterPaste;
    }

    this._onChange();
    return [endLine, endCol];
};

BufferModel.prototype.getLine = function(lineNum) {
    this._validateLineNumHard(lineNum);

    return this.lines[lineNum];
};

BufferModel.prototype.getLastLineNum = function() {
    return this.lines.length - 1;
};

BufferModel.prototype.getRange = function(startLine, startCol, endLine, endCol) {
    this._validatePosHard(startLine, startCol);
    this._validatePosHard(endLine, endCol);

    const res = [];
    if (startLine === endLine) {
        res.push(this.lines[startLine].slice(startCol, endCol));
    } else {
        res.push(this.lines[startLine].slice(startCol));
        for (let i = startLine + 1; i < endLine; i++) {
            res.push(this.lines[i]);
        }
        res.push(this.lines[endLine].slice(0, endCol));        
    }
    return res;
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

// Performs a wrapping search in the given direction.
// If term is given, returns the location of the first occurence of
// term after [startLine, startCol], or null if none exist.
// If term is falsy, returns the next match of the currently active search term,
// if one exists, or null otherwise.
BufferModel.prototype.search = function(term, direction = 'forward', startLine, startCol) {
    this._validatePosHard(startLine, startCol);
    
    if (term) {
        this.activeSearchTerm = new RegExp(term, 'g');
    }
    if (!this.activeSearchTerm) {
        return null;
    }
    return direction === 'forward' ?
        this._searchForward(startLine, startCol) :
        this._searchBack(startLine, startCol);
};

BufferModel.prototype._searchForward = function (startLine, startCol) {
    const start = this.lines[startLine].slice(startCol);
    let match = this.activeSearchTerm.exec(start);
    if (match) {
        return [startLine, match.index + startCol];
    }
    for (let i = startLine + 1; i < this.lines.length; i++) {
        match = this.activeSearchTerm.exec(this.lines[i]);
        if (match) {
            return [i, match.index];
        }
    }
    for (let i = 0; i < startLine; i++) {
        match = this.activeSearchTerm.exec(this.lines[i]);
        if (match) {
            return [i, match.index];
        }
    }
    const end = this.lines[startLine].slice(0, startCol);
    match = this.activeSearchTerm.exec(end);
    return match ? [startLine, match.index] : null;
};

BufferModel.prototype._searchBack = function(startLine, startCol) {
    const start = this.lines[startLine].slice(0, startCol);
    let match = getLastMatch(start, this.activeSearchTerm);
    if (match) {
        return [startLine, match.index];
    }
    for (let i = startLine - 1; i >= 0; i--) {
        match = getLastMatch(this.lines[i], this.activeSearchTerm);
        if (match) {
            return [i, match.index];
        }
    }
    for (let i = this.lines.length - 1; i > startLine; i--) {
        match = getLastMatch(this.lines[i], this.activeSearchTerm);
        if (match) {
            return [i, match.index];
        }
    }
    const end = this.lines[startLine].slice(startCol);
    match = this.activeSearchTerm.exec(end);
    return match ? [startLine, match.index + startCol] : null;
};

function getLastMatch(text, regexp) {
    let last = regexp.exec(text);
    while (true) {
        const curr = regexp.exec(text);
        if (!curr) {
            break;
        }
        last = curr;
    }
    return last;
}

// Returns all matches of a wrapped search for 'term', ordered in accordance with the
// direction starting at [startLine, startCol].
BufferModel.prototype._searchAll = function(term, direction, startLine, startCol) {
    this._validatePosHard(startLine, startCol);

    const regex = new RegExp(term, 'g');
    const matches = [];
    
    findAllMatches(this.lines[startLine].slice(startCol), regex, startLine, startCol, matches);
    for (let i = startLine + 1; i < this.lines.length; i++) {
        findAllMatches(this.lines[i], regex, i, 0, matches);
    }
    for (let i = 0; i < startLine; i++) {
        findAllMatches(this.lines[i], regex, i, 0, matches);
    }
    findAllMatches(this.lines[startLine].slice(0, startCol), regex, startLine, 0, matches);

    return direction === 'forward' ? matches : matches.reverse();
};

function findAllMatches(term, regex, line, offset, out) {
    while (true) {
        const match = regex.exec(term);
        if (!match) {
            break;
        }
        out.push([line, match.index + offset]);
    }
}

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
    if (col < 0 || col > this.lines[lineNum].length) {
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
