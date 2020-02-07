// #package js/main

// #include UIObject.js

class Textbox extends UIObject {

constructor(options) {
    super(TEMPLATES.Textbox, options);

    Object.assign(this, {
        value       : null,
        pattern     : null,
        placeholder : null
    }, options);

    if (this.value !== null) {
        this._binds.input.value = this.value;
    }
    if (this.pattern !== null) {
        this._binds.input.pattern = this.pattern;
    }
    if (this.placeholder !== null) {
        this._binds.input.placeholder = this.placeholder;
    }

    this._regex = new RegExp(this.pattern);
}

setEnabled(enabled) {
    this._binds.input.disabled = !enabled;
    super.setEnabled(enabled);
}

isValid() {
    return this._regex.test(this._binds.input.value);
}

getValue() {
    return this._binds.input.value;
}

getMatch() {
    return this._binds.input.value.match(this._regex);
}

}
