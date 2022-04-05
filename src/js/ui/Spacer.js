import { UIObject } from './UIObject.js';

const response = await fetch('./html/ui/Spacer.html');
const template = await response.text();

export class Spacer extends UIObject {

constructor(options) {
    super(template, options);

    Object.assign(this, {
        width  : null,
        height : null
    }, options);

    if (this.width) {
        this._element.style.width = this.width;
    }
    if (this.height) {
        this._element.style.height = this.height;
    }
}

}
