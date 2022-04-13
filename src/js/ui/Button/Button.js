import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('Button.html', import.meta.url))
    .then(response => response.text());

export class Button extends HTMLElement {

constructor() {
    super();

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);
}

get label() {
    return this.binds.input.value;
}

set label(label) {
    this.binds.input.value = label;
}

}

customElements.define('ui-button', Button);
