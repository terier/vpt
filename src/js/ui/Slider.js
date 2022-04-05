import { UIObject } from './UIObject.js';

const response = await fetch('./html/ui/Slider.html');
const template = await response.text();

export class Slider extends UIObject {

constructor(options) {
    super(template, options);

    Object.assign(this, {
        value       : 0,
        min         : 0,
        max         : 100,
        step        : 1,
        logarithmic : false
    }, options);

    this._handlePointerDown = this._handlePointerDown.bind(this);
    this._handlePointerUp   = this._handlePointerUp.bind(this);
    this._handlePointerMove = this._handlePointerMove.bind(this);
    this._handleWheel     = this._handleWheel.bind(this);

    this._updateUI();

    this._element.addEventListener('pointerdown', this._handlePointerDown);
    this._element.addEventListener('wheel', this._handleWheel);
}

destroy() {
    document.removeEventListener('pointerup', this._handlePointerUp);
    document.removeEventListener('pointermove', this._handlePointerMove);

    super.destroy();
}

setValue(value) {
    this.value = Math.min(Math.max(value, this.min), this.max);
    this._updateUI();
    this.trigger('change');
}

_updateUI() {
    if (this.logarithmic) {
        const logmin = Math.log(this.min);
        const logmax = Math.log(this.max);
        const ratio = (Math.log(this.value) - logmin) / (logmax - logmin) * 100;
        this._binds.button.style.marginLeft = ratio + '%';
    } else {
        const ratio = (this.value - this.min) / (this.max - this.min) * 100;
        this._binds.button.style.marginLeft = ratio + '%';
    }
}

getValue() {
    return this.value;
}

_setValueByEvent(e) {
    const rect = this._binds.container.getBoundingClientRect();
    const ratio = (e.pageX - rect.left) / (rect.right - rect.left);
    if (this.logarithmic) {
        const logmin = Math.log(this.min);
        const logmax = Math.log(this.max);
        const value = Math.exp(logmin + ratio * (logmax - logmin));
        this.setValue(value);
    } else {
        const value = this.min + ratio * (this.max - this.min);
        this.setValue(value);
    }
}

_handlePointerDown(e) {
    document.addEventListener('pointerup', this._handlePointerUp);
    document.addEventListener('pointermove', this._handlePointerMove);
    this._setValueByEvent(e);
}

_handlePointerUp(e) {
    document.removeEventListener('pointerup', this._handlePointerUp);
    document.removeEventListener('pointermove', this._handlePointerMove);
    this._setValueByEvent(e);
}

_handlePointerMove(e) {
    this._setValueByEvent(e);
}

_handleWheel(e) {
    let wheel = e.deltaY;
    if (wheel < 0) {
        wheel = 1;
    } else if (wheel > 0) {
        wheel = -1;
    } else {
        wheel = 0;
    }

    const delta = this.logarithmic ? this.value * this.step * wheel : this.step * wheel;
    this.setValue(this.value + delta);
}

}
