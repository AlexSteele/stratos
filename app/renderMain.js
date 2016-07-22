'use strict';

// const electron = require('electron');
// const {ipcRenderer} = electron;
const {Editor} = require('./app/editor.js');
const {defaultKeyMaps} = require('./app/keyMap.js');

const editor = new Editor(document.body, defaultKeyMaps);
editor.newTab();
