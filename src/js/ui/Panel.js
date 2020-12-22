// #part /js/ui/Panel

// #link UIObject

class Panel extends UIObject {

constructor(options) {
    super(TEMPLATES.ui.Panel, options);
}

add(object) {
    object.appendTo(this._element);
}

}
