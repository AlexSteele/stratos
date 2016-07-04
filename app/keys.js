'use strict';

const defaultKeyMap = (function() {
    const keys = {
        'Enter':      {type: 'INSERT_NEW_LINE'},
        'Backspace':  {type: 'DELETE_BACK_CHAR'},
        'ArrowLeft':  {type: 'MOVE_CURSOR_LEFT'},
        'ArrowRight': {type: 'MOVE_CURSOR_RIGHT'},
        'ArrowUp':    {type: 'MOVE_CURSOR_UP'},
        'Control-p':  {type: 'MOVE_CURSOR_UP'},
        'ArrowDown':  {type: 'MOVE_CURSOR_DOWN'},
        'Control-n':  {type: 'MOVE_CURSOR_DOWN'},
        'Control-a':  {type: 'MOVE_CURSOR_BEGINNING_OF_LINE'},
        'Control-e':  {type: 'MOVE_CURSOR_END_OF_LINE'}
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

    keys[' '] = {type: 'INSERT', text: ' '};

    return keys;
}());

function createKeyListener(elem, keyMap, onKeyAction, onKeyError) {
    
    const activeModifiers = [];
    
    elem.addEventListener('keydown', (e) => {
        e.preventDefault();

        if (keyIsModifier(e.key)) {
            activeModifiers.push(e.key);
            if (!isValidActionPrefix(activeModifiers.join('-'))) {
                activeModifiers.splice(0, activeModifiers.length);
                onKeyError(activeModifiers.join('-'));
            }
            return;
        }

        const withModifiers = activeModifiers.length === 0 ?
                  e.key :
                  activeModifiers.join('-') + '-' + e.key;
        
        const action = keyMap[withModifiers];

        if (action) {
            onKeyAction(action);
        } else {
            onKeyError(withModifiers);
        }

        activeModifiers.splice(0, activeModifiers.length); 
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
    
    elem.addEventListener('keyup', (e) => {
        e.preventDefault();
        
        const index = activeModifiers.indexOf(e.key);
        if (index !== -1) {
            activeModifiers.splice(index, 1);
        }
    });
};

module.exports = {
    defaultKeyMap,
    createKeyListener
};
