import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./Sidebar.html', import.meta.url))
    .then(response => response.text());

export class Sidebar extends HTMLElement {

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

clickListener() {
    this.contracted = !this.contracted;
}

}

customElements.define('ui-sidebar', Sidebar);
