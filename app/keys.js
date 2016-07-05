'use strict';

const defaultKeyMap = (function() {
    const keys = {
        'Enter':         {type: 'INSERT_NEW_LINE'},
        'Tab':           {type: 'INSERT', text: '    '}, // TODO: Change this to reflect preferences/mode etc.
        'Backspace':     {type: 'DELETE_BACK_CHAR'},
        'Control-k':     {type: 'KILL_LINE'},
        'ArrowLeft':     {type: 'MOVE_CURSOR_LEFT'},
        'Control-b':     {type: 'MOVE_CURSOR_LEFT'},
        'ArrowRight':    {type: 'MOVE_CURSOR_RIGHT'},
        'Control-f':     {type: 'MOVE_CURSOR_RIGHT'},
        'ArrowUp':       {type: 'MOVE_CURSOR_UP'},
        'Control-p':     {type: 'MOVE_CURSOR_UP'},
        'ArrowDown':     {type: 'MOVE_CURSOR_DOWN'},
        'Control-n':     {type: 'MOVE_CURSOR_DOWN'},
        'Control-a':     {type: 'MOVE_CURSOR_BEGINNING_OF_LINE'},
        'Control-e':     {type: 'MOVE_CURSOR_END_OF_LINE'},
        'Alt-Meta-Dead': {type: 'NATIVE!'},
        'Meta-q':        {type: 'NATIVE!'}
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

function createKeyListener(elem, keyMap, onKeyAction, onKeyError) {
    
    const activeModifiers = [];
    
    elem.addEventListener('keydown', (e) => {
        if (keyIsModifier(e.key)) {
            activeModifiers.push(e.key);
            return;
        }

        const withModifiers = activeModifiers.length === 0 ?
                  e.key :
                  activeModifiers.join('-') + '-' + e.key;
        
        const action = keyMap[withModifiers];

        if (action) {
            if (action.type === 'NATIVE!') {
                return;
            }
            onKeyAction(action);
        } else {
            onKeyError(withModifiers);
        }

         e.preventDefault();
    });

    elem.addEventListener('keypress', (e) => {
        e.preventDefault();
    });

    elem.addEventListener('keyup', (e) => {
        e.preventDefault();

        const index = activeModifiers.indexOf(e.key);
        if (index !== -1) {
            activeModifiers.splice(index, 1);
        }
    });

    function keyIsModifier(key) {
        return key === 'Control' ||
            key === 'Alt' ||
            key === 'Meta'; 
    }

    const allChords = Object.keys(keyMap); 

    function isValidActionPrefix(prefix) {
        const pattern = new RegExp(prefix);
        return allChords.find(e => pattern.test(e));
    }
    
};

module.exports = {
    defaultKeyMap,
    createKeyListener
};
