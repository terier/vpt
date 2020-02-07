// #package js/main

// #include ../../utils
// #include ../AbstractDialog.js

// #include ../../../uispecs/renderers/ISORendererDialog.json

class ISORendererDialog extends AbstractDialog {

constructor(renderer, options) {
    super(UISPECS.ISORendererDialog, options);

    this._renderer = renderer;

    this._handleChange = this._handleChange.bind(this);

    this._binds.steps.addEventListener('input', this._handleChange);
    this._binds.isovalue.addEventListener('change', this._handleChange);
    this._binds.color.addEventListener('change', this._handleChange);
    this._binds.direction.addEventListener('input', this._handleChange);
}

_handleChange() {
    this._renderer._stepSize = 1 / this._binds.steps.getValue();
    this._renderer._isovalue = this._binds.isovalue.getValue();

    const color = CommonUtils.hex2rgb(this._binds.color.getValue());
    this._renderer._diffuse[0] = color.r;
    this._renderer._diffuse[1] = color.g;
    this._renderer._diffuse[2] = color.b;

    const direction = this._binds.direction.getValue();
    this._renderer._light[0] = direction.x;
    this._renderer._light[1] = direction.y;
    this._renderer._light[2] = direction.z;

    this._renderer.reset();
}

}
