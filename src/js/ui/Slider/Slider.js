import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./Slider.html', import.meta.url))
    .then(response => response.text());

export class Slider extends HTMLElement {

constructor() {
    super();

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);

    this.pointerdownListener = this.pointerdownListener.bind(this);
    this.pointerupListener = this.pointerupListener.bind(this);
    this.pointermoveListener = this.pointermoveListener.bind(this);
    this.wheelListener = this.wheelListener.bind(this);

    this._updateUI();

    this.addEventListener('pointerdown', this.pointerdownListener);
    this.addEventListener('wheel', this.wheelListener);
}

get value() { return Number(this.getAttribute('value') ?? 0); }
get min() { return Number(this.getAttribute('min') ?? 0); }
get max() { return Number(this.getAttribute('max') ?? 100); }
get step() { return Number(this.getAttribute('step') ?? 1); }

set value(value) { this.setAttribute('value', value); }
set min(min) { this.setAttribute('min', min); }
set max(max) { this.setAttribute('max', max); }
set step(step) { this.setAttribute('step', step); }

get logarithmic() {
    return this.hasAttribute('logarithmic');
}

set logarithmic(logarithmic) {
    if (logarithmic) {
        this.setAttribute('logarithmic', '');
    } else {
        this.removeAttribute('logarithmic');
    }
}

static observedAttributes = [ 'value', 'min', 'max' ];

attributeChangedCallback(name) {
    this._updateUI();
    if (name === 'value') {
        this.dispatchEvent(new Event('change'));
    }
}

_updateUI() {
    if (this.logarithmic) {
        const logmin = Math.log(this.min);
        const logmax = Math.log(this.max);
        const ratio = (Math.log(this.value) - logmin) / (logmax - logmin) * 100;
        this.binds.button.style.marginLeft = ratio + '%';
    } else {
        const ratio = (this.value - this.min) / (this.max - this.min) * 100;
        this.binds.button.style.marginLeft = ratio + '%';
    }
}

_setValueByEvent(e) {
    const rect = this.binds.container.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.pageX - rect.left) / (rect.right - rect.left), 0), 1);
    if (this.logarithmic) {
        const logmin = Math.log(this.min);
        const logmax = Math.log(this.max);
        this.value = Math.exp(logmin + ratio * (logmax - logmin));
    } else {
        this.value = this.min + ratio * (this.max - this.min);
    }
}

pointerdownListener(e) {
    this.setPointerCapture(e.pointerId);
    this.addEventListener('pointerup', this.pointerupListener);
    this.addEventListener('pointermove', this.pointermoveListener);
    this._setValueByEvent(e);
}

pointerupListener(e) {
    this.releasePointerCapture(e.pointerId);
    this.removeEventListener('pointerup', this.pointerupListener);
    this.removeEventListener('pointermove', this.pointermoveListener);
    this._setValueByEvent(e);
}

pointermoveListener(e) {
    this._setValueByEvent(e);
}

wheelListener(e) {
    let wheel = e.deltaY;
    if (wheel < 0) {
        wheel = 1;
    } else if (wheel > 0) {
        wheel = -1;
    } else {
        wheel = 0;
    }

    const delta = this.logarithmic ? this.value * this.step * wheel : this.step * wheel;
    this.value += delta;
}

}

customElements.define('ui-slider', Slider);
