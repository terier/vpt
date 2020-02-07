// #package js/main

// #include UIObject.js
// #include Spinner.js

class VectorSpinner extends UIObject {

constructor(options) {
    super(TEMPLATES.VectorSpinner, options);

    Object.assign(this, {
        value : 0,
        min   : null,
        max   : null,
        step  : 1
    }, options);

    this._handleChange = this._handleChange.bind(this);
    this._handleInput = this._handleInput.bind(this);

    const opts = {
        value : this.value,
        min   : this.min,
        max   : this.max,
        step  : this.step
    };

    this._spinnerX = new Spinner(opts);
    this._spinnerY = new Spinner(opts);
    this._spinnerZ = new Spinner(opts);

    this._spinnerX.appendTo(this._binds.vectorX);
    this._spinnerY.appendTo(this._binds.vectorY);
    this._spinnerZ.appendTo(this._binds.vectorZ);

    this._spinnerX.addEventListener('change', this._handleChange);
    this._spinnerY.addEventListener('change', this._handleChange);
    this._spinnerZ.addEventListener('change', this._handleChange);
    this._spinnerX.addEventListener('input', this._handleInput);
    this._spinnerY.addEventListener('input', this._handleInput);
    this._spinnerZ.addEventListener('input', this._handleInput);
}

destroy() {
    this._spinnerX.destroy();
    this._spinnerY.destroy();
    this._spinnerZ.destroy();

    super.destroy();
}

setEnabled(enabled) {
    this._spinnerX.setEnabled(enabled);
    this._spinnerY.setEnabled(enabled);
    this._spinnerZ.setEnabled(enabled);
    super.setEnabled(enabled);
}

setVisible(visible) {
    this._spinnerX.setVisible(visible);
    this._spinnerY.setVisible(visible);
    this._spinnerZ.setVisible(visible);
    super.setVisible(visible);
}

setValue(value) {
    this._spinnerX.setValue(value.x);
    this._spinnerY.setValue(value.y);
    this._spinnerZ.setValue(value.z);
}

getValue() {
    return {
        x: this._spinnerX.getValue(),
        y: this._spinnerY.getValue(),
        z: this._spinnerZ.getValue(),
    };
}

_handleChange() {
    this.trigger('change');
}

_handleInput() {
    this.trigger('input');
}

}
