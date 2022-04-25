import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./Radio.html', import.meta.url))
    .then(response => response.text());

const templateOption = await fetch(new URL('./RadioOption.html', import.meta.url))
    .then(response => response.text());

export class Radio extends HTMLElement {

static #nextId = 0;

constructor() {
    super();

    this.clickListener = this.clickListener.bind(this);

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);

    this.name = 'radio' + Radio.#nextId++;
}

get vertical() {
    return this.hasAttribute('vertical');
}

set vertical(vertical) {
    if (vertical) {
        this.setAttribute('vertical', '');
    } else {
        this.removeAttribute('vertical');
    }
}

get value() {
    const selector = '.radio-option > input:checked';
    const input = this.querySelector(selector);
    return input ? input.value : null;
}

set value(value) {
    const selector = '.radio-option > input[value="' + value + '"]';
    const input = this.querySelector(selector);
    if (input) {
        input.select();
    }
}

addOption(value, label, selected) {
    const option = DOMUtils.instantiate(templateOption);
    const binds = DOMUtils.bind(option);
    binds.input.name = this.name;
    binds.input.value = value;
    if (selected) {
        binds.input.checked = true;
    }
    binds.label.textContent = label;
    binds.label.addEventListener('click', this.clickListener);
    this.shadow.appendChild(option);
}

clickListener(e) {
    e.currentTarget.parentNode.querySelector('input').checked = true;
}

static observedAttributes = ['value'];

attributeChangedCallback() {
    this.dispatchEvent(new Event('change'));
}

}

customElements.define('ui-radio', Radio);
