'use strict';

const defaultEditorMap = (function() {
    const keys = {
        'Enter':          {type: 'INSERT_NEW_LINE'},
        'Tab':            {type: 'INSERT', text: '    '}, // TODO: Change this to reflect preferences/mode etc.
        'Backspace':      {type: 'DELETE_BACK_CHAR'},
        'Control-d':      {type: 'DELETE_FORWARD_CHAR'},
        'Control-k':      {type: 'KILL_LINE'},
        'ArrowLeft':      {type: 'MOVE_CURSOR_LEFT'},
        'Control-b':      {type: 'MOVE_CURSOR_LEFT'},
        'ArrowRight':     {type: 'MOVE_CURSOR_RIGHT'},
        'Control-f':      {type: 'MOVE_CURSOR_RIGHT'},
        'ArrowUp':        {type: 'MOVE_CURSOR_UP'},
        'Control-p':      {type: 'MOVE_CURSOR_UP'},
        'ArrowDown':      {type: 'MOVE_CURSOR_DOWN'},
        'Control-n':      {type: 'MOVE_CURSOR_DOWN'},
        'Control-a':      {type: 'MOVE_CURSOR_BEGINNING_OF_LINE'},
        'Control-e':      {type: 'MOVE_CURSOR_END_OF_LINE'},
        'Alt-Meta-Dead':  {type: 'NATIVE!'},
        'Meta-q':         {type: 'NATIVE!'},
        'Meta-Control-p': {type: 'TOGGLE_COMMAND_MODAL'},
        'Control-t':      {type: 'NEW_TAB'},
        'Control-w':      {type: 'CLOSE_TAB'} // TODO: CHANGE THIS BINDING.
    };
    
    ['a', 'b', 'c', 'd',
     'e', 'f', 'g', 'h',
     'i', 'j', 'k', 'l',
     'm', 'n', 'o', 'p',
     'q', 'r', 's', 't',
     'u', 'v', 'w', 'x',
     'y', 'z'].forEach(e => {
         keys[e] = {type: 'INSERT', text: e};
         keys[e.toUpperCase()] = {type: 'INSERT', text: e.toUpperCase()};
     });

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach(e => {
        keys[e] = {type: 'INSERT', text: (e + '')};
    });

    [' ', ',', '<', '.', '>',
     '[', '{', ']', '}', '\\',
     '|', '/', '?', '`', '~',
     '!', '@', '#', '$', '%',
     '^', '&', '*', '(', ')',
     '-', '_', '=', '+', ':',
     ';', '"', '\''].forEach(e => {
         keys[e] = {type: 'INSERT', text: e};
     });

    return keys;
}());

const defaultCommandModalKeyMap = (function() {
    const keys = {
        'Meta-Control-p': {type: 'TOGGLE_COMMAND_MODAL'}
    };
    return keys;
}());

const defaultKeyMaps = {
    'editor-default': defaultEditorMap,
    'command-modal-default': defaultCommandModalKeyMap
};

module.exports = {
    defaultKeyMaps
};