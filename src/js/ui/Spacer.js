// #part /js/ui/Spacer

// #link UIObject

class Spacer extends UIObject {

constructor(options) {
    super(TEMPLATES.ui.Spacer, options);

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
