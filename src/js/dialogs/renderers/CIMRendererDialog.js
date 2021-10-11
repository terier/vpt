// #part /js/dialogs/renderers/CIMRendererDialog

// #link ../../utils
// #link ../AbstractDialog

// #link /uispecs/renderers/CIMRendererDialog

class CIMRendererDialog extends AbstractDialog {

constructor(renderer, options) {
    super(UISPECS.renderers.CIMRendererDialog, options);

    this._renderer = renderer;

    this._handleChange = this._handleChange.bind(this);
    this._handleTFChange = this._handleTFChange.bind(this);

    this._binds.steps.addEventListener('input', this._handleChange);
    this._binds.isovalue.addEventListener('change', this._handleChange);
    this._binds.color.addEventListener('change', this._handleChange);
    this._binds.direction.addEventListener('input', this._handleChange);

    this._binds.extinction.addEventListener('input', this._handleChange);
    this._binds.albedo.addEventListener('change', this._handleChange);
    this._binds.bias.addEventListener('change', this._handleChange);
    this._binds.ratio.addEventListener('change', this._handleChange);
    this._binds.bounces.addEventListener('input', this._handleChange);
    this._binds.mcm_steps.addEventListener('input', this._handleChange);

    this._tfwidget = new TransferFunctionWidget();
    this._binds.tfcontainer.add(this._tfwidget);
    this._tfwidget.addEventListener('change', this._handleTFChange);
}

destroy() {
    this._tfwidget.destroy();
    super.destroy();
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

    const extinction = this._binds.extinction.getValue();
    const albedo     = this._binds.albedo.getValue();
    const bias       = this._binds.bias.getValue();
    const ratio      = this._binds.ratio.getValue();
    const bounces    = this._binds.bounces.getValue();
    const steps      = this._binds.steps.getValue();

    this._renderer.absorptionCoefficient = extinction * (1 - albedo);
    this._renderer.scatteringCoefficient = extinction * albedo;
    this._renderer.scatteringBias = bias;
    this._renderer.majorant = extinction * ratio;
    this._renderer.maxBounces = bounces;
    this._renderer.steps = steps;

    this._renderer.reset();
}

_handleTFChange() {
    this._renderer.setTransferFunction(this._tfwidget.getTransferFunction());
    this._renderer.reset();
}

}
