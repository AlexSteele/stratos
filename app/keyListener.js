'use strict';

const defaults = {
    keyMap: {},
    allowDefaultOnKeyError: false,
    onKeyAction: () => { throw new Error('KeyListener: No handler for onKeyAction.'); },
    onKeyError: () => { throw new Error('KeyListener: No handler for onKeyError.'); }
};

function KeyListener(elem, settings = defaults) {

    this.keyMap = settings.keyMap || defaults.keyMap;
    this.onKeyAction = settings.onKeyAction || defaults.onKeyAction;
    this.onKeyError = settings.onKeyError || defaults.onKeyError;
    this.allowDefaultOnKeyError = (typeof settings.allowDefaultOnKeyError === 'undefined') ? defaults.allowDefaultOnKeyError : settings.allowDefaultOnKeyError;
    
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
       // e.preventDefault();
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
    KeyListener
};
