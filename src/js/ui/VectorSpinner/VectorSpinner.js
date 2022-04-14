import { Spinner } from '../Spinner/Spinner.js';
import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./VectorSpinner.html', import.meta.url))
    .then(response => response.text());

export class VectorSpinner extends HTMLElement {

constructor() {
    super();

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);
}

get value() {
    return [
        this.binds.x.value,
        this.binds.y.value,
        this.binds.z.value,
    ];
}

set value(value) {
    this.binds.x.value = value[0];
    this.binds.y.value = value[1];
    this.binds.z.value = value[2];
}

get min() {
    return [
        this.binds.x.min,
        this.binds.y.min,
        this.binds.z.min,
    ];
}

set min(min) {
    this.binds.x.min = min[0];
    this.binds.y.min = min[1];
    this.binds.z.min = min[2];
}

get max() {
    return [
        this.binds.x.max,
        this.binds.y.max,
        this.binds.z.max,
    ];
}

set max(max) {
    this.binds.x.max = max[0];
    this.binds.y.max = max[1];
    this.binds.z.max = max[2];
}

get step() {
    return [
        this.binds.x.step,
        this.binds.y.step,
        this.binds.z.step,
    ];
}

set step(step) {
    this.binds.x.step = step[0];
    this.binds.y.step = step[1];
    this.binds.z.step = step[2];
}

}

customElements.define('ui-vector-spinner', VectorSpinner);
