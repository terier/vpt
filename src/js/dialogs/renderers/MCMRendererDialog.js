// #part /js/dialogs/renderers/MCMRendererDialog

// #link ../AbstractDialog
// #link ../../TransferFunctionWidget

// #link /uispecs/renderers/MCMRendererDialog

class MCMRendererDialog extends AbstractDialog {

constructor(renderer, options) {
    super(UISPECS.renderers.MCMRendererDialog, options);

    this._renderer = renderer;

    this._handleChange = this._handleChange.bind(this);
    this._handleTFChange = this._handleTFChange.bind(this);
    this._handleChangeWithoutReset = this._handleChangeWithoutReset.bind(this);

    this._binds.extinction.addEventListener('input', this._handleChange);
    this._binds.bias.addEventListener('change', this._handleChange);
    this._binds.ratio.addEventListener('change', this._handleChange);
    this._binds.bounces.addEventListener('input', this._handleChange);
    this._binds.steps.addEventListener('change', this._handleChangeWithoutReset);

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

_handleTFChange() {
    this._renderer.setTransferFunction(this._tfwidget.getTransferFunction());
    this._renderer.reset();
}

_handleChangeWithoutReset() {
    this._renderer.steps = this._binds.steps.getValue();
}

}
