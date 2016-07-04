'use strict';

const defaultKeyMap = (function() {
    const keys = {
        'Enter':      {type: 'INSERT_NEW_LINE'},
        'ArrowLeft':  {type: 'MOVE_CURSOR_LEFT'},
        'ArrowRight': {type: 'MOVE_CURSOR_RIGHT'},
        'ArrowUp':    {type: 'MOVE_CURSOR_UP'},
        'ArrowDown':  {type: 'MOVE_CURSOR_DOWN'},
        'Backspace':  {type: 'DELETE_BACK_CHAR'}
    };
    
    ['a', 'b', 'c', 'd',
     'e', 'f', 'g', 'h',
     'i', 'j', 'k', 'l',
     'm', 'n', 'o', 'p',
     'q', 'r', 's', 't',
     'u', 'v', 'w', 'x',
     'y', 'z'].forEach(e => {
         keys[e] = {type: 'INSERT', text: e};
         keys['Shift-' + e] = {type: 'INSERT', text: e.toUpperCase()};
     });

    const upcaseNums = {
        1: '!',
        2: '@',
        3: '#',
        4: '$',
        5: '%',
        6: '^',
        7: '&',
        8: '*',
        9: '(',
        10: ')'
    };

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(e => {
        keys[e] = {type: 'INSERT', text: (e + '')};
        keys['Shift-' + e] = {type: 'INSERT', text: upcaseNums[e] };
    });
    

    keys[' '] = {type: 'INSERT', text: ' '};

    return keys;
}());

function createKeyListener(elem, keyMap, onKeyAction, onKeyError) {
    
    const activeModifiers = [];
    
    elem.addEventListener('keydown', (e) => {
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
        return key === 'Shift' ||
            key === 'Control' ||
            key === 'Alt' ||
            key === 'Meta'; 
    }

    const allChords = Object.keys(keyMap); 

    function isValidActionPrefix(prefix) {
        const pattern = new Regex(prefix);
        return allChords.find(e => pattern.test(e));
    }
    
    elem.addEventListener('keyup', (e) => {
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
