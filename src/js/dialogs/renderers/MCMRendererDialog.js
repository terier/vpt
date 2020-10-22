// #package js/main

// #include ../AbstractDialog.js
// #include ../../TransferFunctionWidget.js

// #include ../../../uispecs/renderers/MCMRendererDialog.json

// #include ../../ui

class MCMRendererDialog extends AbstractDialog {

constructor(renderer, options) {
    super(UISPECS.MCMRendererDialog, options);

    this._renderer = renderer;

    this._handleChange = this._handleChange.bind(this);
    this._handleTFChange = this._handleTFChange.bind(this);

    this._binds.extinction.addEventListener('input', this._handleChange);
    this._binds.albedo.addEventListener('change', this._handleChange);
    this._binds.bias.addEventListener('change', this._handleChange);
    this._binds.ratio.addEventListener('change', this._handleChange);   
    this._binds.bounces.addEventListener('input', this._handleChange);
    this._binds.steps.addEventListener('input', this._handleChange);

    this._tfwidgets = [];
    for (let i = 0; i < 4; i++) {
        this._tfwidgets[i] = new TransferFunctionWidget();
        let panel = new Panel();
        panel.add(this._tfwidgets[i]);
        this._binds.tftabs.add(""+i, panel);
        this._tfwidgets[i].addEventListener('change', () => {this._handleTFChange(i)});
    }
}

destroy() {
    this._tfwidget.destroy();
    super.destroy();
}

_updateTFWidgets(number) {
    for (let i = 1; i <= 4; i++) {
        if (i <= number)
            this._binds.tftabs._binds.headers.children[i].hidden = false;
        else
            this._binds.tftabs._binds.headers.children[i].hidden = true;
    }
}

_handleChange() {
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

_handleTFChange(id) {
    this._renderer.setTransferFunction(this._tfwidgets[id].getTransferFunction(), id);
    this._renderer.reset();
}

_handleScaleChange(dimensions) {
    this._binds.scale.setValue(new Vector(dimensions.x, dimensions.y, dimensions.z));
}

}
