'use strict';

// const electron = require('electron');
// const {ipcRenderer} = electron;
const keyMaps = require('./app/keyMap.js');
const Editor = require('./app/editor.js');
const {getSharedEditorComponentSettings} = require('./app/utils.js');

const settings = {
    keyMaps: keyMaps.defaults,
    sharedEditorComponentSettings: getSharedEditorComponentSettings(document.body)
};

const editor = new Editor(document.body, settings);
