import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./ProgressBar.html', import.meta.url))
    .then(response => response.text());

export class ProgressBar extends HTMLElement {

constructor() {
    super();

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);
}

get value() {
    return Number(this.getAttribute('value') ?? 0);
}

set value(value) {
    const percentage = Math.min(Math.max(value * 100, 0), 100);
    this.binds.progress.style.width = percentage.toFixed(3) + '%';
    this.binds.label.textContent = percentage.toFixed(0) + '%';
}

static observedAttributes = ['value'];

attributeChangedCallback() {
    this.dispatchEvent(new Event('change'));
}

}

customElements.define('ui-progress-bar', ProgressBar);
