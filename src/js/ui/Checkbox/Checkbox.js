import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('Checkbox.html', import.meta.url))
    .then(response => response.text());

export class Checkbox extends HTMLElement {

constructor() {
    super();

    this.clickListener = this.clickListener.bind(this);

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);

    this.addEventListener('click', this.clickListener);
}

get value() {
    return this.checked;
}

set value(value) {
    this.checked = value;
}

get checked() {
    return this.hasAttribute('checked');
}

set checked(checked) {
    if (checked) {
        this.setAttribute('checked', '');
    } else {
        this.removeAttribute('checked');
    }
}

clickListener() {
    this.checked = !this.checked;
}

static observedAttributes = ['checked'];

attributeChangedCallback() {
    this.dispatchEvent(new Event('change'));
}

}

customElements.define('ui-checkbox', Checkbox);
