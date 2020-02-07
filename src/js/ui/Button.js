// #package js/main

// #include UIObject.js

class Button extends UIObject {

constructor(options) {
    super(TEMPLATES.Button, options);

    Object.assign(this, {
        label: ''
    }, options);

    this._binds.input.value = this.label;
}

setEnabled(enabled) {
    this._binds.input.disabled = !enabled;
    super.setEnabled(enabled);
}

}
