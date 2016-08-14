'use strict';

const KeyListener = require('./keyListener.js');

// Map input text to either 1) an editor action or 2) to false (if the input is invalid).
const inputHandlers = {
    'close-all':     () => ({type: 'CLOSE_ALL'}),
    'close-editor':  (params) => params.length === 0 ? {type: 'CLOSE_EDITOR'} : {type: 'CLOSE_EDITOR', name: params[0]},
    'close-pane':    () => ({type: 'CLOSE_PANE'}),
    'del':           () => ({type: 'DELETE_FORWARD_CHAR'}),    
    'del-back':      () => ({type: 'DELETE_BACK_CHAR'}),
    'goto':          (params) => params.length > 0 ? {type: 'MOVE_TO_POS', line: +params[0], col: (+params[1] || 1)} : false,
    'hide-ctxt':     () => ({type: 'HIDE_CONTEXT'}),
    'hide-gutter':   () => ({type: 'HIDE_GUTTER'}),
    'hide-tabs':     () => ({type: 'HIDE_TABS'}),
    'ins':           (params) => ({type: 'INSERT', text: params.join(' ')}),
    'new-editor':    (params) => params.length === 0 ? {type: 'NEW_EDITOR'} : {type: 'NEW_EDITOR', name: params[0]},
    'open':          (params) => params.length === 1 ? {type: 'OPEN_FILE', name: params[0]} : false,
    'save':          () => ({type: 'SAVE_BUFFER'}),
    'save-as':       (params) => params.length === 1 ? {type: 'SAVE_BUFFER_AS', name: params[0]} : false,
    'search':        (params) => params.length > 0 ? {type: 'SEARCH_FORWARD', text: params.join('')} : {type: 'SEARCH_FORWARD'},
    'search-back':   (params) => params.length > 0 ? {type: 'SEARCH_BACK', text: params.join('')} : {type: 'SEARCH_BACK'},
    'show-ctxt':     () => ({type: 'SHOW_CONTEXT'}),
    'show-gutter':   () => ({type: 'SHOW_GUTTER'}),
    'show-tabs':     () => ({type: 'SHOW_TABS'}),
    'split-above':   () => ({type: 'SPLIT_PANE_ABOVE'}),
    'split-below':   () => ({type: 'SPLIT_PANE_BELOW'}),
    'split-left':    () => ({type: 'SPLIT_PANE_LEFT'}),
    'split-right':   () => ({type: 'SPLIT_PANE_RIGHT'}),
    'swap-above':    () => ({type: 'SWAP_PANE_ABOVE'}),
    'swap-below':    () => ({type: 'SWAP_PANE_BELOW'}),
    'swap-left':     () => ({type: 'SWAP_PANE_LEFT'}),
    'swap-right':    () => ({type: 'SWAP_PANE_RIGHT'}),
    'switch-above':  () => ({type: 'SWITCH_PANE_ABOVE'}),
    'switch-below':  () => ({type: 'SWITCH_PANE_BELOW'}),
    'switch-left':   () => ({type: 'SWITCH_PANE_LEFT'}),
    'switch-right':  () => ({type: 'SWITCH_PANE_RIGHT'}),
    'switch-editor': (params) => params.length === 0 ? {type: 'SWITCH_EDITOR'} : {type: 'SWITCH_EDITOR', name: params[0]}
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
