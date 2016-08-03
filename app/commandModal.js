'use strict';

const KeyListener = require('./keyListener.js');

// Map input text to either 1) an editor action or 2) to false (if the input is invalid).
const inputHandlers = {
    'ins':          (params) => ({type: 'INSERT', text: params.join(' ')}),
    'del':          () => ({type: 'DELETE_FORWARD_CHAR'}),    
    'del-back':     () => ({type: 'DELETE_BACK_CHAR'}),
    'goto':         (params) => params.length > 0 ? {type: 'MOVE_TO_POS', line: +params[0], col: (+params[1] || 1)} : false,
    'open':         (params) => params.length === 1 ? {type: 'OPEN_FILE', name: params[0]} : false,
    'save-as':      (params) => params.length === 1 ? {type: 'SAVE_BUFFER_AS', name: params[0]} : false,
    'new-pane':     (params) => params.length === 0 ? {type: 'NEW_PANE'} : {type: 'NEW_PANE', name: params[0]},
    'switch-pane':  (params) => params.length === 0 ? {type: 'SWITCH_PANE'} : {type: 'SWITCH_PANE', name: params[0]},
    'switch-above': () => ({type: 'SWITCH_PANE_GROUP_ABOVE'}),
    'switch-below': () => ({type: 'SWITCH_PANE_GROUP_BELOW'}),
    'switch-left':  () => ({type: 'SWITCH_PANE_GROUP_LEFT'}),
    'switch-right': () => ({type: 'SWITCH_PANE_GROUP_RIGHT'}),
    'swap-above':   () => ({type: 'SWAP_PANE_GROUP_ABOVE'}),
    'swap-below':   () => ({type: 'SWAP_PANE_GROUP_BELOW'}),
    'swap-left':    () => ({type: 'SWAP_PANE_GROUP_LEFT'}),
    'swap-right':   () => ({type: 'SWAP_PANE_GROUP_RIGHT'}),
    'split-above':  () => ({type: 'SPLIT_PANE_GROUP_ABOVE'}),
    'split-below':  () => ({type: 'SPLIT_PANE_GROUP_BELOW'}),
    'split-left':   () => ({type: 'SPLIT_PANE_GROUP_LEFT'}),
    'split-right':  () => ({type: 'SPLIT_PANE_GROUP_RIGHT'}),
    'close-pane':   (params) => params.length === 0 ? {type: 'CLOSE_PANE'} : {type: 'CLOSE_PANE', name: params[0]},
    'close-all':    () => ({type: 'CLOSE_ALL'}),
    'close-group':  () => ({type: 'CLOSE_PANE_GROUP'}),
    'show-tabs':    () => ({type: 'SHOW_TABS'}),
    'hide-tabs':    () => ({type: 'HIDE_TABS'}),
    'show-gutter':  () => ({type: 'SHOW_GUTTER'}),
    'hide-gutter':  () => ({type: 'HIDE_GUTTER'}),
    'show-ctxt':    () => ({type: 'SHOW_CONTEXT'}),
    'hide-ctxt':    () => ({type: 'HIDE_CONTEXT'})
};

const defaults = {
    inputHandlers,
    keyMap: {},
    onKeyAction: (action) => { throw new Error('CommandModal: No handler for onKeyAction.'); },
    onKeyError: (error) => { throw new Error('CommandModal: No handler for onKeyError.'); },
    onSubmitAction: (action) => {throw new Error('CommandModal: No handler for onSubmitAction.');},
    onSubmitActionError: (input) => {throw new Error('CommandModal: No handler for onSubmitActionError.');}
};

function CommandModal(parentElem, settings = defaults) {

    this.domNode = document.createElement('div');
    this.domNode.className = 'command-modal-container';
    this.domNode.style.visibility = 'hidden';
    parentElem.appendChild(this.domNode);

    this.inputNode = document.createElement('input');
    this.inputNode.className = 'command-modal-input';
    this.inputNode.type = 'text';    
    this.domNode.appendChild(this.inputNode);

    this.inputHandlers = settings.inputHandlers || defaults.inputHandlers;
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

    this._initEventListeners();
};

CommandModal.prototype._initEventListeners = function() {
    this.inputNode.addEventListener('keydown', (e) => {
        if (e.keyCode === 13) {
            this._handleCommandSubmit();
        }
    });
};

CommandModal.prototype.toggle = function() {
    const wasVisible = this.isVisible();
    this.domNode.style.visibility = wasVisible ? 'hidden' : 'visible';
    if (!wasVisible) {
        this.inputNode.select();
    }
};

CommandModal.prototype.isVisible = function() {
    return this.domNode.style.visibility === 'visible';
};

CommandModal.prototype.clearInput = function() {
    return this.inputNode.value = '';
};

CommandModal.prototype._handleCommandSubmit = function() {
    const input = this.inputNode.value.split(' ');
    const cmdName = input[0];
    const handler = this.inputHandlers[cmdName];
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

module.exports = CommandModal;
