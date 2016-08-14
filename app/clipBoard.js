'use strict';

const {clipboard} = require('electron');

function ClipBoard() {
    this.clips = new Array(16);
    this.index = -1;
}

ClipBoard.prototype.write = function(text) {
    clipboard.writeText(text);
    this.index = (this.index + 1) % this.clips.length;
    this.clips[this.index] = text;
};

ClipBoard.prototype.read = function() {
    return this.clips[this.index];
};

module.exports = ClipBoard; 
