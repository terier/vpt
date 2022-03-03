// #package js/main

// #include ../AbstractDialog.js
// #include ../../TransferFunctionWidget.js

// #include ../../../uispecs/renderers/MCMRendererDialog.json

class MCMRendererDialog extends AbstractDialog {

constructor(renderer, options) {
    super(UISPECS.MCMRendererDialog, options);

    this._renderer = renderer;

    this._handleChange = this._handleChange.bind(this);
    this._handleTFChange = this._handleTFChange.bind(this);
    this._handleChangeWithoutReset = this._handleChangeWithoutReset.bind(this);

    this._binds.extinction.addEventListener('input', this._handleChange);
    this._binds.bias.addEventListener('change', this._handleChange);
    this._binds.ratio.addEventListener('change', this._handleChange);
    this._binds.bounces.addEventListener('input', this._handleChange);
    this._binds.steps.addEventListener('change', this._handleChangeWithoutReset);

    this._binds.isovalue.addEventListener('input', this._handleChange);
    this._binds.color.addEventListener('change', this._handleChange);
    this._binds.light.addEventListener('change', this._handleChange);
    this._binds.direction.addEventListener('change', this._handleChange);


    this._handleChangeWithoutReset();
    this._handleChange();

    this._tfwidget = new TransferFunctionWidget();
    this._binds.tfcontainer.add(this._tfwidget);
    this._tfwidget.addEventListener('change', this._handleTFChange);
}

destroy() {
    this._tfwidget.destroy();
    super.destroy();
}

_handleChange() {
    const extinction = this._binds.extinction.getValue();
    const bias       = this._binds.bias.getValue();
    const ratio      = this._binds.ratio.getValue();
    const bounces    = this._binds.bounces.getValue();
    const light      = this._binds.light.isChecked();
    const direction  = this._binds.direction.getValue();

    this._renderer.extinctionScale = extinction;
    this._renderer.scatteringBias = bias;
    this._renderer.majorant = extinction * ratio;
    this._renderer.maxBounces = bounces;

    this._renderer._isovalue = this._binds.isovalue.getValue();
    const color = CommonUtils.hex2rgb(this._binds.color.getValue());
    this._renderer._color[0] = color.r;
    this._renderer._color[1] = color.g;
    this._renderer._color[2] = color.b;
    (light) ? direction.w = 1 : direction.w = 0;
    this._renderer._light = [direction.x, direction.y, direction.z, direction.w];

    this._renderer.reset();
}

_handleTFChange() {
    this._renderer.setTransferFunction(this._tfwidget.getTransferFunction());
    this._renderer.reset();
}

_handleChangeWithoutReset() {
    this._renderer.steps = this._binds.steps.getValue();
}

}
