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

    this._binds.extinction.addEventListener('input', this._handleChange);
    this._binds.albedo.addEventListener('change', this._handleChange);
    this._binds.bias.addEventListener('change', this._handleChange);
    this._binds.ratio.addEventListener('change', this._handleChange);
    this._binds.bounces.addEventListener('input', this._handleChange);
    this._binds.steps.addEventListener('input', this._handleChange);

    this._atf = new TransferFunctionWidget();
    this._binds.atfContainer.add(this._atf);
    this._atf.addEventListener('change', this._handleTFChange);

    this._stf = new TransferFunctionWidget();
    this._binds.stfContainer.add(this._stf);
    this._stf.addEventListener('change', this._handleTFChange);
}

destroy() {
    this._atf.destroy();
    this._stf.destroy();
    super.destroy();
}

_handleChange() {
    const extinction = this._binds.extinction.getValue();
    const albedo     = this._binds.albedo.getValue();
    const bias       = this._binds.bias.getValue();
    const ratio      = this._binds.ratio.getValue();
    const bounces    = this._binds.bounces.getValue();
    const steps      = this._binds.steps.getValue();

    this._renderer.absorptionScale = extinction * (1 - albedo);
    this._renderer.scatteringScale = extinction * albedo;
    this._renderer.scatteringBias = bias;
    this._renderer.majorant = extinction * ratio;
    this._renderer.maxBounces = bounces;
    this._renderer.steps = steps;

    this._renderer.reset();
}

_handleTFChange() {
    this._renderer.setAbsorptionTransferFunction(this._atf.getTransferFunction());
    this._renderer.setScatteringTransferFunction(this._stf.getTransferFunction());
    this._renderer.reset();
}

}
