import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./Textbox.html', import.meta.url))
    .then(response => response.text());

export class Textbox extends HTMLElement {

constructor() {
    super();

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);
}

get value() { return this.binds.input.value; }
set value(value) { this.binds.input.value = value; }

get placeholder() { return this.binds.input.placeholder; }
set placeholder(placeholder) { this.binds.input.placeholder = placeholder; }

}

customElements.define('ui-textbox', Textbox);
