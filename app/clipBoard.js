'use strict';

function ClipBoard() {
    this.clips = new Array(16);
    this.index = -1;
}

ClipBoard.prototype.add = function(text) {
    this.index = (this.index + 1) % this.clips.length;
    this.clips[this.index] = text;
};

ClipBoard.prototype.peek = function() {
    return this.clips[this.index];
};

module.exports = ClipBoard; 
