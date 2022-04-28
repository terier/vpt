import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./VectorSpinner.html', import.meta.url))
    .then(response => response.text());

export class VectorSpinner extends HTMLElement {

constructor() {
    super();

    this.changeListener = this.changeListener.bind(this);

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);

    this.binds.x.addEventListener('change', this.changeListener);
    this.binds.y.addEventListener('change', this.changeListener);
    this.binds.z.addEventListener('change', this.changeListener);

    if (this.hasAttribute('value')) {
        this.value = JSON.parse(this.getAttribute('value'));
    }
}

get value() {
    return [
        Number(this.binds.x.value),
        Number(this.binds.y.value),
        Number(this.binds.z.value),
    ];
}

set value(value) {
    this.binds.x.value = value[0];
    this.binds.y.value = value[1];
    this.binds.z.value = value[2];
}

get min() {
    return [
        Number(this.binds.x.min),
        Number(this.binds.y.min),
        Number(this.binds.z.min),
    ];
}

set min(min) {
    this.binds.x.min = min[0];
    this.binds.y.min = min[1];
    this.binds.z.min = min[2];
}

get max() {
    return [
        Number(this.binds.x.max),
        Number(this.binds.y.max),
        Number(this.binds.z.max),
    ];
}

set max(max) {
    this.binds.x.max = max[0];
    this.binds.y.max = max[1];
    this.binds.z.max = max[2];
}

get step() {
    return [
        Number(this.binds.x.step),
        Number(this.binds.y.step),
        Number(this.binds.z.step),
    ];
}

set step(step) {
    this.binds.x.step = step[0];
    this.binds.y.step = step[1];
    this.binds.z.step = step[2];
}

changeListener(e) {
    this.dispatchEvent(new Event('change'));
}

}

customElements.define('ui-vector-spinner', VectorSpinner);
