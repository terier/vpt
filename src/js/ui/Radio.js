// #package js/main

// #include ../utils
// #include UIObject.js

class Radio extends UIObject {

constructor(options) {
    super(TEMPLATES.Radio, options);

    Object.assign(this, {
        options  : [],
        vertical : false
    }, options);

    this._handleClick = this._handleClick.bind(this);

    this._radioName = 'radio' + Radio._nextId++;
    this._element.classList.toggle('vertical', this.vertical);
    for (let option of this.options) {
        this.addOption(option.value, option.label, option.selected);
    }
}

addOption(value, label, selected) {
    const option = DOMUtils.instantiate(TEMPLATES.RadioOption);
    let binds = DOMUtils.bind(option);
    binds.input.name = this._radioName;
    binds.input.value = value;
    if (selected) {
        binds.input.checked = true;
    }
    binds.label.textContent = label;
    binds.label.addEventListener('click', this._handleClick);
    this._element.appendChild(option);
}

getValue() {
    const selector = '.radio-option > input:checked';
    const input = this._element.querySelector(selector);
    return input ? input.value : null;
}

setValue(value) {
    const selector = '.radio-option > input[value="' + value + '"]';
    const input = this._element.querySelector(selector);
    if (input) {
        input.select();
    }
}

_handleClick(e) {
    e.currentTarget.parentNode.querySelector('input').checked = true;
}

}

Radio._nextId = 0;
