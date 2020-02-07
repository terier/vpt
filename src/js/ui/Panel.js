// #package js/main

// #include UIObject.js

class Panel extends UIObject {

constructor(options) {
    super(TEMPLATES.Panel, options);
}

add(object) {
    object.appendTo(this._element);
}

}
