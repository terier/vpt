// #package js/main

// #include ../AbstractDialog.js

// #include ../../../uispecs/renderers/MIPRendererDialog.json

class MIPRendererDialog extends AbstractDialog {

constructor(renderer, options) {
    super(UISPECS.MIPRendererDialog, options);

    this._renderer = renderer;

    this._handleChange = this._handleChange.bind(this);

    this._binds.steps.addEventListener('change', this._handleChange);
}

_handleChange() {
    this._renderer._stepSize = 1 / this._binds.steps.getValue();
}

}
