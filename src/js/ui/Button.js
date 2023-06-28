import { UIObject } from './UIObject.js';

const response = await fetch('./html/ui/Button.html');
const template = await response.text();

export class Button extends UIObject {

constructor(options) {
    super(template, options);

    Object.assign(this, {
        label: ''
    }, options);

    this._handleClick = this._handleClick.bind(this);

    this._binds.input.value = this.label;
    this._element.addEventListener('click', this._handleClick);
}

setEnabled(enabled) {
    this._binds.input.disabled = !enabled;
    super.setEnabled(enabled);
}

getValue() {
    return true;
}

_handleClick() {
    this.trigger('change');
}

}
