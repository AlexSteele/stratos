'use strict';

function LineRange() {
    this.startLine = -1;
    this.startCol = -1;
    this.endLine = -1;
    this.endCol = -1;
};

LineRange.prototype.setTo = function(startLine, startCol, endLine, endCol) {
    this.startLine = startLine;
    this.startCol = startCol;
    this.endLine = endLine;
    this.endCol = endCol;
};

LineRange.prototype.clear = function() {
    this.startLine = -1;
    this.startCol = -1;
    this.endLine = -1;
    this.endCol = -1;
};

LineRange.prototype.isEmpty = function() {
    return this.startLine === -1 &&
        this.startCol === -1 &&
        this.endLine === -1 &&
        this.endCol === -1;
};

LineRange.prototype.splat = function() {
    return {
        startLine: this.startLine,
        startCol: this.startCol,
        endLine: this.endLine,
        endCol: this.endCol
    };
};

LineRange.prototype.spansMultipleLines = function() {
    return !this.isEmpty() && this.startLine !== this.endLine;
};

module.exports = LineRange;
