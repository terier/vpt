// #package js/main

// #include ../utils
// #include UIObject.js

class Dropdown extends UIObject {

constructor(options) {
    super(TEMPLATES.Dropdown, options);

    Object.assign(this, {
        options: []
    }, options);

    for (let option of this.options) {
        this.addOption(option.value, option.label, option.selected);
    }
}

addOption(value, label, selected) {
    let option = document.createElement('option');
    option.value = value;
    option.text = label;
    this._binds.input.add(option);
    if (selected) {
        this._binds.input.value = value;
    }
}

removeOption(value) {
    const selector = 'option[value="' + value + '"]';
    const option = this._binds.input.querySelector(selector);
    if (option) {
        DOMUtils.remove(option);
    }
}

setValue(value) {
    this._binds.input.value = value;
}

getValue() {
    return this._binds.input.value;
}

}
