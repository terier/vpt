import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./Spinner.html', import.meta.url))
    .then(response => response.text());

export class Spinner extends HTMLElement {

constructor() {
    super();

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);
}

get value() { return this.binds.input.value; }
set value(value) { this.binds.input.value = value; }

get min() { return this.binds.input.min; }
set min(min) { this.binds.input.min = min; }

get max() { return this.binds.input.max; }
set max(max) { this.binds.input.max = max; }

get step() { return this.binds.input.step; }
set step(step) { this.binds.input.step = step; }

get disabled() { return this.binds.input.disabled; }
set disabled(disabled) { this.binds.input.disabled = disabled; }

}

customElements.define('ui-spinner', Spinner);
