// #package js/main

// #include ../AbstractDialog.js
// #include ../../TransferFunctionWidget.js

// #include ../../../uispecs/renderers/IMCRendererDialog.json

class IMCRendererDialog extends AbstractDialog {

constructor(renderer, options) {
    super(UISPECS.IMCRendererDialog, options);

    this._renderer = renderer;

    this._handleChange = this._handleChange.bind(this);
    this._handleTFChange = this._handleTFChange.bind(this);

    this._binds.steps.addEventListener('input', this._handleChange);
    this._binds.isovalue.addEventListener('change', this._handleChange);
    this._binds.color.addEventListener('change', this._handleChange);
    this._binds.direction.addEventListener('input', this._handleChange);

    this._binds.f0.addEventListener('change', this._handleChange);
    this._binds.f90.addEventListener('change', this._handleChange);
    this._binds.specularWeight.addEventListener('change', this._handleChange);
    this._binds.alphaRoughness.addEventListener('change', this._handleChange);

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

    this._renderer.f0 = this._binds.f0.getValue();
    this._renderer.f90 = this._binds.f90.getValue();
    // const f0 = this._binds.f0.getValue();
    // this._renderer.f0[0] = f0.x;
    // this._renderer.f0[1] = f0.y;
    // this._renderer.f0[2] = f0.z;

    // const f90 = this._binds.f90.getValue();
    // this._renderer.f90[0] = f90.x;
    // this._renderer.f90[1] = f90.y;
    // this._renderer.f90[2] = f90.z;

    this._renderer.specularWeight = this._binds.specularWeight.getValue();
    this._renderer.alphaRoughness = this._binds.alphaRoughness.getValue();

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
