'use strict';

const electron = require('electron'); 
const {app, BrowserWindow, ipcMain} = electron; 

console.log('Electron: \n' + electron);          // TODO: ???

let win;

function createWindow() {
    win = new BrowserWindow({width: 800, height: 600});
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

ipcMain.on('asynchronous-message', (event, arg) => {
    console.log('Event: ' + event);
    for (let prop in event) {
        console.log(prop + ': ' + event[prop]);
    }
    console.log('Arg: ' + arg);
    for (let prop in arg) {
        console.log(prop + ': ' + arg[prop]); 
    }
    event.sender.send('asynchronous-message',
                 {type: 'ACK_BUFFER_KEY_PRESS',
                  key: arg.key});
});
