import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./Accordion.html', import.meta.url))
    .then(response => response.text());

export class Accordion extends HTMLElement {

constructor() {
    super();

    this.clickListener = this.clickListener.bind(this);

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);

    this.binds.handle.addEventListener('click', this.clickListener);
}

get contracted() {
    return this.hasAttribute('contracted');
}

set contracted(contracted) {
    if (contracted) {
        this.setAttribute('contracted', '');
    } else {
        this.removeAttribute('contracted');
    }
}

clickListener(e) {
    this.contracted = !this.contracted;
}

}

customElements.define('ui-accordion', Accordion);
