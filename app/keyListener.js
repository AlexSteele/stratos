'use strict';

const defaults = {
    keyMap: {},
    allowDefaultOnKeyError: false,
    onKeyAction: (action) => { throw new Error('KeyListener: No handler for onKeyAction.'); },
    onKeyError: (error) => { throw new Error('KeyListener: No handler for onKeyError.'); }
};

function KeyListener(elem, settings = defaults) {

    this.elem = elem;
    this.keyMap = settings.keyMap || defaults.keyMap;
    this.onKeyAction = settings.onKeyAction || defaults.onKeyAction;
    this.onKeyError = settings.onKeyError || defaults.onKeyError;
    this.allowDefaultOnKeyError = (typeof settings.allowDefaultOnKeyError === 'undefined') ?
        defaults.allowDefaultOnKeyError : settings.allowDefaultOnKeyError;
    this.areListenersAttached = false;
    
    const activeModifiers = [];

    this._onKeyDown = (e) => {
        const key = e.key;
        if (keyIsModifier(key)) {
            activeModifiers.push(e.key);
            return;
        }

        const withModifiers = activeModifiers.length === 0 ?
                  key :
                  activeModifiers.join('-') + '-' + key;
        
        const action = this.keyMap[withModifiers];

        if (action) {
            if (action.type === 'NATIVE!') {
                return;
            }
            this.onKeyAction(action);
            e.preventDefault();
            e.stopPropagation();
        } else if (!this.allowDefaultOnKeyError) {
            this.onKeyError(withModifiers);
            e.preventDefault();
            e.stopPropagation();
        }
    };

    this._onKeyUp = (e) => {
        e.preventDefault();

        const index = activeModifiers.indexOf(e.key);
        if (index !== -1) {
            activeModifiers.splice(index, 1);
        }
    };

    function keyIsModifier(key) {
        return key === 'Control' ||
            key === 'Meta' ||
            key === 'Alt';
    }

    // Drop active modifiers when focus lost.
    this._onBlur = () => activeModifiers.splice(0, activeModifiers.length);

    this.attach();
};

KeyListener.prototype.attach = function() {
    if (!this.areListenersAttached) {
        this.areListenersAttached = true;
        this.elem.addEventListener('keydown', this._onKeyDown);
        this.elem.addEventListener('keyup', this._onKeyUp);
        this.elem.addEventListener('blur', this._onBlur);
    }
};    

// Removes attached DOM event listeners.
KeyListener.prototype.unattach = function() {
    if (this.areListenersAttached) {
        this.areListenersAttached = false;
        this.elem.removeEventListener('keydown', this._onKeyDown);
        this.elem.removeEventListener('keyup', this._onKeyUp);
        this.elem.removeEventListener('blur', this._onBlur);
    }    
};

module.exports = {
    KeyListener
};
