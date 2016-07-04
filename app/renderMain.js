'use strict';

const electron = require('electron');
const {ipcRenderer} = electron;
const childProcess = require('child_process');
const {Editor} = require('./app/editor.js'); 

// const orbProcess = childProcess.spawn('orb');
// orbProcess.stdout.on('data', d => console.log('Data received from orb: ' + d));
// orbProcess.stderr.on('data', d => console.log('Err received from orb: ' + d));
// orbProcess.on('close', code => console.log('Orb closed with code ' + code));
// orbProcess.on('error', (e) => console.log('Error: ' + e)); 
// orbProcess.kill();

const editor = new Editor(document.body);
