'use strict';

const {KeyListener} = require('./keyListener.js');

// TODO: Move these to a more _official_ place.
const actionHandlers = {
    'ins':       (params) => ({type: 'INSERT', text: params.join(' ')}),
    'goto':      (params) => params.length === 2 ? {type: 'MOVE_TO_POS', line: +params[0], col: +params[1]} : false,
    'del':       () => ({type: 'DELETE_FORWARD_CHAR'}),
    'del-back':  () => ({type: 'DELETE_BACK_CHAR'}),
    'new-tab':   (params) => params.length === 0 ? {type: 'NEW_TAB'} : {type: 'NEW_TAB', name: params[0]},
    'switch-tab': (params) => params.length === 0 ? {type: 'SWITCH_TAB'} : {type: 'SWITCH_TAB', name: params[0]},
    'close-tab': (params) => params.length === 0 ? {type: 'CLOSE_TAB'} : {type: 'CLOSE_TAB', name: params[0]}
};

const defaults = {
    actionHandlers,
    keyMap: {},
    onKeyAction: (action) => { throw new Error('CommandModal: No handler for onKeyAction.'); },
    onKeyError: (error) => { throw new Error('CommandModal: No handler for onKeyError.'); },
    onSubmitAction: (action) => {throw new Error('CommandModal: No handler for onSubmitAction.');},
    onSubmitActionError: (error) => {throw new Error('CommandModal: No handler for onSubmitActionError.');}
};

function CommandModal(parentElem, settings = defaults) {

    this.domNode = document.createElement('div');
    this.domNode.className = 'command-modal-container';
    this.domNode.style.visibility = 'hidden';
    parentElem.appendChild(this.domNode);

    this.inputNode = document.createElement('input');
    this.inputNode.className = 'command-modal-input';
    this.inputNode.type = 'text';    
    this.inputNode.addEventListener('keydown', (e) => {
        if (e.keyCode === 13) {
            this._handleCommandSubmit();
        }
    });
    this.domNode.appendChild(this.inputNode);

    this.actionHandlers = settings.actionHandlers || defaults.actionHandlers;
    this.keyMap = settings.keyMap || defaults.keyMap;
    this.onKeyAction = settings.onKeyAction || defaults.onKeyAction;
    this.onKeyError = settings.onKeyError || defaults.onKeyError;
    this.onSubmitAction = settings.onSubmitAction || defaults.onSubmitAction;
    this.onSubmitActionError = settings.onSubmitActionError || defaults.onSubmitActionError;    

    this.keyListener = new KeyListener(this.domNode, {
        keyMap: this.keyMap,
        allowDefaultOnKeyError: true,
        onKeyAction: this.onKeyAction,
        onKeyError: this.onKeyError
    });  
};

CommandModal.prototype.toggle = function() {
    const siblings = siblingElems(this.domNode);
    if (this.domNode.style.visibility === 'visible') {
        siblings.forEach(e => e.classList.remove('slight-fade'));
        this.domNode.style.visibility = 'hidden';
    } else {
        siblings.forEach(e => e.classList.add('slight-fade'));
        this.domNode.style.visibility = 'visible';
        this.inputNode.select();
    }
};

CommandModal.prototype.isToggled = function() {
    return this.domNode.style.visibility === 'visible';
};

CommandModal.prototype.clearInput = function() {
    return this.inputNode.value = '';
};

CommandModal.prototype._handleCommandSubmit = function() {
    const input = this.inputNode.value.split(' ');
    const cmdName = input[0];
    const handler = this.actionHandlers[cmdName];
    if (handler) {
        const params = input.slice(1);
        const action = handler(params);
        if (action) {
            this.onSubmitAction(action);                
            return;
        }
    }
    this.onSubmitActionError(this.inputNode.value);
};

// Assumes a parent element.
function siblingElems(elem) {
    const siblings = [];
    const children = elem.parentElement.children;
    for (let each of children) {
        if (each !== elem) {
            siblings.push(each);
        }
    }
    return siblings;
}

module.exports.CommandModal = CommandModal;
