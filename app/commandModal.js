'use strict';

// TODO: Move these to a more _official_ place.
const actionHandlers = {
    'ins':      (params) => ({type: 'INSERT', text: params.join(' ')}),
    'goto':     (params) => params.length === 2 ? {type: 'MOVE_TO_POS', line: +params[0], col: +params[1]} : false,
    'del':      () => ({type: 'DELETE_FORWARD_CHAR'}),
    'del-back': () => ({type: 'DELETE_BACK_CHAR'})
};

const defaults = {
    actionHandlers,
    onSubmitAction: () => {throw new Error('CommandModal: No handler for onSubmitAction.');},
    onSubmitActionError: () => {throw new Error('CommandModal: No handler for onSubmitActionError.');}
};

function CommandModal(parentElem, settings = defaults) {

    this.actionHandlers = settings.actionHandlers || defaults.actionHandlers;
    this.onSubmitAction = settings.onSubmitAction || defaults.onSubmitAction;
    this.onSubmitActionError = settings.onSubmitActionError || defaults.onSubmitActionError;

    this.domNode = document.createElement('div');
    this.domNode.className = 'command-modal-container';

    this.inputNode = document.createElement('input');
    this.inputNode.className = 'command-modal-input';
    this.inputNode.type = 'text';
    this.inputNode.addEventListener('keydown', (e) => {
        if (e.keyCode === 13) {
            this._handleCommandSubmit();
        }
    });
    this.domNode.appendChild(this.inputNode);
    this.domNode.style.visibility = 'hidden';
    
    parentElem.appendChild(this.domNode);
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
