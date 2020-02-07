// #package js/main

// #include UIObject.js

class Spacer extends UIObject {

constructor(options) {
    super(TEMPLATES.Spacer, options);

    Object.assign(this, {
        width  : null,
        height : null
    }, options);

    if (this.width) {
        this._element.style.width = this.width;
    }
    if (this.height) {
        this._element.style.height = this.height;
    }
}

}
