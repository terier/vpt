import { UIObject } from './UIObject.js';

const response = await fetch('./html/ui/Button.html');
const template = await response.text();

export class Button extends UIObject {

constructor(options) {
    super(template, options);

    Object.assign(this, {
        label: ''
    }, options);

    this._binds.input.value = this.label;
}

setEnabled(enabled) {
    this._binds.input.disabled = !enabled;
    super.setEnabled(enabled);
}

}
