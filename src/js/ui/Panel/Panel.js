import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./Panel.html', import.meta.url))
    .then(response => response.text());

export class Panel extends HTMLElement {

constructor() {
    super();

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);
}

get scrollable() {
    return this.hasAttribute('scrollable');
}

set scrollable(scrollable) {
    if (scrollable) {
        this.setAttribute('scrollable', '');
    } else {
        this.removeAttribute('scrollable');
    }
}

}

customElements.define('ui-panel', Panel);
