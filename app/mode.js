'use strict';

const {defaults} = require('./keyMap.js');

const plainText = {
    name: 'plain-text',
    filePatters: /txt/,
    keyMap: defaults['editor'],
    wordDelimiters: [' ', '.', ',', '-', '/', '!', '?', '"', '\'', '(', ')', '[', ']', '{', '}'],
    isWordDelimiter: (c) => plainText.wordDelimiters.some(e => e === c)
};

const modes = {
    default: plainText
};

module.exports = modes;
