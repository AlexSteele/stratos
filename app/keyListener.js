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
    this.allowDefaultOnKeyError = settings.allowDefaultOnKeyError == null ?
        defaults.allowDefaultOnKeyError : settings.allowDefaultOnKeyError;
    this.areListenersAttached = false;
    this.activeModifiers = [];

    this._onKeyDown = (e) => {
        const key = e.key;
        if (keyIsModifier(key)) {
            this.activeModifiers.push(e.key);
            return;
        }

        const withModifiers = this.activeModifiers.length === 0 ?
                  key :
                  this.activeModifiers.join('-') + '-' + key;
        
        const action = this.keyMap[withModifiers];

        if (action) {
            if (action.type === 'NATIVE!') {
                return;
            }
            this.onKeyAction(action);
        } else if (this.activeModifiers.length === 1 &&
                   this.activeModifiers[0] === 'Shift') {
            const action = this.keyMap[key];
            if (action.type === 'NATIVE') {
                return;
            }
            this.onKeyAction(action);
        } else if (this.allowDefaultOnKeyError) {
            return;
        } else {
            this.onKeyError(withModifiers);
        }

        e.stopPropagation();
        e.preventDefault();
    };

    this._onKeyUp = (e) => {
        e.preventDefault();

        const index = this.activeModifiers.indexOf(e.key);
        if (index !== -1) {
            this.activeModifiers.splice(index, 1);
        }
    };

    function keyIsModifier(key) {
        return key === 'Control' ||
            key === 'Meta' ||
            key === 'Alt' ||
            key === 'Shift';
    }

    // Drop active modifiers when focus lost.
    this._onBlur = () => this.activeModifiers.splice(0, this.activeModifiers.length);

    this.attach();
};

KeyListener.prototype.isShiftPressed = function() {
    return this.activeModifiers.some(e => e === 'Shift');
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

module.exports = KeyListener;
