'use strict';

// Active when an editorPane is active.
const defaultEditorMap = (function() {
    const keys = {
        'Alt-Control-p':  {type: 'TOGGLE_COMMAND_MODAL'},
        'Alt-Meta-Dead':  {type: 'NATIVE!'},
        'ArrowDown':      {type: 'MOVE_CURSOR_DOWN'},
        'ArrowLeft':      {type: 'MOVE_CURSOR_LEFT'},
        'ArrowRight':     {type: 'MOVE_CURSOR_RIGHT'},
        'ArrowUp':        {type: 'MOVE_CURSOR_UP'},
        'Backspace':      {type: 'DELETE_BACK_CHAR'},
        'Control-a':      {type: 'MOVE_CURSOR_BEGINNING_OF_LINE'},
        'Control-b':      {type: 'MOVE_CURSOR_LEFT'},
        'Control-c':      {type: 'COPY_SELECTION'},
        'Control-d':      {type: 'DELETE_FORWARD_CHAR'},
        'Control-e':      {type: 'MOVE_CURSOR_END_OF_LINE'},
        'Control-f':      {type: 'MOVE_CURSOR_RIGHT'},
        'Control-k':      {type: 'KILL_LINE'},
        'Control-l':      {type: 'TOGGLE_CURSOR_REL_POS'},
        'Control-n':      {type: 'MOVE_CURSOR_DOWN'},
        'Control-o':      {type: 'OPEN_LINE'},
        'Control-p':      {type: 'MOVE_CURSOR_UP'},
        'Control-r':      {type: 'SEARCH_BACK'},
        'Control-s':      {type: 'SEARCH_FORWARD'},
        'Control-t':      {type: 'NEW_EDITOR'},
        'Control-v':      {type: 'PASTE'},
        'Control-w':      {type: 'CLOSE_EDITOR'},
        'Control-x':      {type: 'KILL_SELECTION'},
        'Enter':          {type: 'INSERT_NEW_LINE'},
        'Meta-Backspace': {type: 'DELETE_BACK_WORD'},
        'Meta-Control-p': {type: 'TOGGLE_COMMAND_MODAL'},
        'Meta-b':         {type: 'MOVE_CURSOR_BACK_WORD'},
        'Meta-d':         {type: 'DELETE_FORWARD_WORD'},
        'Meta-f':         {type: 'MOVE_CURSOR_FORWARD_WORD'},
        'Meta-h':         {type: 'SWITCH_PANE_LEFT'},
        'Meta-j':         {type: 'SWITCH_PANE_BELOW'},
        'Meta-k':         {type: 'SWITCH_PANE_ABOVE'},
        'Meta-l':         {type: 'SWITCH_PANE_RIGHT'},
        'Meta-q':         {type: 'NATIVE!'},
        'Tab':            {type: 'INSERT', text: '    '}
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

// Active when the command modal is active.
const defaultCommandModalMap = {
    'Meta-Control-p': {type: 'TOGGLE_COMMAND_MODAL'}
};

// Active when no editor panes are open.
const defaultNoEditorsMap = {
    'Meta-Control-p': {type: 'TOGGLE_COMMAND_MODAL'},
    'Control-t':      {type: 'NEW_EDITOR'}
};

const defaults = {
    'editor': defaultEditorMap,
    'command-modal': defaultCommandModalMap,
    'no-editors': defaultNoEditorsMap
};

module.exports = {
    defaults   
};
