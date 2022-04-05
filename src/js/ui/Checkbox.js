import { UIObject } from './UIObject.js';

const response = await fetch('./html/ui/Checkbox.html');
const template = await response.text();

export class Checkbox extends UIObject {

constructor(options) {
    super(template, options);

    Object.assign(this, {
        checked : true
    }, options);

    this._handleClick = this._handleClick.bind(this);

    this._element.addEventListener('click', this._handleClick);
    this._element.classList.toggle('checked', this.checked);
}

isChecked() {
    return this.checked;
}

setChecked(checked) {
    if (this.checked !== checked) {
        this.checked = checked;
        this._element.classList.toggle('checked', checked);
        this.trigger('change');
    }
}

toggleChecked() {
    this.setChecked(!this.checked);
}

_handleClick() {
    if (this.enabled) {
        this.toggleChecked();
    }
}

}
