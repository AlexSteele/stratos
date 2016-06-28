'use strict';

const electron = require('electron');
const {ipcRenderer} = electron;
const childProcess = require('child_process');
const {EditorPaneController} = require('./app/editorPaneController.js');
const {EditorViewController} = require('./app/editorViewController.js');
const {CursorView} = require('./app/cursorView.js');
const {BufferView} = require('./app/bufferView.js'); 

// const orbProcess = childProcess.spawn('orb');
// orbProcess.stdout.on('data', d => console.log('Data received from orb: ' + d));
// orbProcess.stderr.on('data', d => console.log('Err received from orb: ' + d));
// orbProcess.on('close', code => console.log('Orb closed with code ' + code));
// orbProcess.on('error', (e) => console.log('Error: ' + e)); 
// orbProcess.kill();

// const myCursor = new CursorView();

// document.body.addEventListener('keydown', () => {
//     myCursor.moveRight();
//     myCursor.moveDown();
//     console.log('cursor moved.');
// });

// const myBufferView = new BufferView();

// document.body.addEventListener('keydown', (k) => {
//     myBufferView.appendLine(k.key);  
// });

const editorRoot = document.getElementById('editor-root');
const editorController = new EditorPaneController(editorRoot); 
