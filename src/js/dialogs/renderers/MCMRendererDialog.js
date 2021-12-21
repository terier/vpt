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
    this._handleChangeLimit = this._handleChangeLimit.bind(this);

    this._binds.extinction.addEventListener('input', this._handleChange);
    this._binds.bias.addEventListener('change', this._handleChange);
    this._binds.ratio.addEventListener('change', this._handleChange);
    this._binds.bounces.addEventListener('input', this._handleChange);
    this._binds.steps.addEventListener('change', this._handleChangeWithoutReset);
    this._binds.timer.addEventListener('input', this._handleChangeLimit);

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

    this._renderer.extinctionScale = extinction;
    this._renderer.scatteringBias = bias;
    this._renderer.majorant = extinction * ratio;
    this._renderer.maxBounces = bounces;

    this._renderer.reset();
}

_handleChangeLimit() {
    const timer = this._binds.timer.getValue();
    this._renderer._timer = timer;
    // console.log(iterationsLimit, timer, this._renderer._done)
    if (this._renderer._done &&
        (timer === 0 || timer * 1000 > this._renderer._elapsedTime)) {
        this._renderer._previousTime = new Date().getTime()
        this._renderer._done = false;
        console.log("Restarting")
    }
}

_handleTFChange() {
    this._renderer.setTransferFunction(this._tfwidget.getTransferFunction());
    this._renderer.reset();
}

_handleChangeWithoutReset() {
    this._renderer.steps = this._binds.steps.getValue();
}

}
