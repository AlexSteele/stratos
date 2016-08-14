'use strict';

// const electron = require('electron');
// const {ipcRenderer} = electron;
const keyMaps = require('./app/keyMap.js');
const StratosEditor = require('./app/stratos.js');
const {getSharedEditorComponentSettings} = require('./app/utils.js');

const settings = {
    keyMaps: keyMaps.defaults,
    sharedEditorComponentSettings: getSharedEditorComponentSettings(document.body)
};

const editor = new StratosEditor(document.body, settings);
