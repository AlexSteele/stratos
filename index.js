'use strict';

const electron = require('electron'); 
const {app, BrowserWindow, ipcMain} = electron; 

let win;

function createWindow() {
    win = new BrowserWindow({width: 1200, height: 800});
    win.on('closed', () => {
        win = null; 
    });
    win.loadURL(`file://${__dirname}/index.html`);
}

app.on('ready', () => {console.log('Starting!'); createWindow();});
app.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (window === null) {
        createWindow();
    }
});

