'use strict';

const defaultKeyMap = (function() {
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

const defaults = {
    keyMap: {},
    allowDefaultOnKeyError: false,
    onKeyAction: () => {throw new Error('KeyListener: No handler for onKeyAction.');},
    onKeyError: () => {throw new Error('KeyListener: No handler for onKeyError.');}
};

function KeyListener(elem, settings = defaults) {

    this.keyMap = settings.keyMap || defaults.keyMap;
    this.onKeyAction = settings.onKeyAction || defaults.onKeyAction;
    this.onKeyError = settings.onKeyError || defaults.onKeyError;
    this.allowDefaultOnKeyError = settings.allowDefaultOnKeyError ||
              defaults.allowDefaultOnKeyError;
    
    const activeModifiers = [];
    
    elem.addEventListener('keydown', (e) => {
        if (keyIsModifier(e.key)) {
            activeModifiers.push(e.key);
            return;
        }

        const withModifiers = activeModifiers.length === 0 ?
                  e.key :
                  activeModifiers.join('-') + '-' + e.key;
        
        const action = this.keyMap[withModifiers];

        if (action) {
            if (action.type === 'NATIVE!') {
                return;
            }
            this.onKeyAction(action);
            e.preventDefault();
        } else if (!this.allowDefaultOnKeyError) {
            this.onKeyError(withModifiers);
            e.preventDefault();
        }
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
            key === 'Meta' ||
            key === 'Alt';
    }

    const allChords = Object.keys(this.keyMap); 

    function isValidActionPrefix(prefix) {
        const pattern = new RegExp(prefix);
        return allChords.find(e => pattern.test(e));
    }

    // Drop active modifiers when focus lost.
    elem.addEventListener('blur', () => activeModifiers.splice(0, activeModifiers.length));
};

KeyListener.prototype.setKeyMap = function(to) {
    this.keyMap = to;
};

KeyListener.prototype.setAllowDefaultOnKeyError = function(on) {
    this.allowDefaultOnKeyError = on;
};

module.exports = {
    defaultKeyMap,
    KeyListener
};
