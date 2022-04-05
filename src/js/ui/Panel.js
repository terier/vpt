import { UIObject } from './UIObject.js';

const response = await fetch('./html/ui/Panel.html');
const template = await response.text();

export class Panel extends UIObject {

constructor(options) {
    super(template, options);

    Object.assign(this, {
        scrollable: false
    }, options);

    this.setScrollable(this.scrollable);
}

setScrollable(scrollable) {
    this.scrollable = scrollable;
    this._element.classList.toggle('scrollable', scrollable);
}

add(object) {
    object.appendTo(this._element);
}

}
