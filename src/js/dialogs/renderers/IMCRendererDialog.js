// #package js/main

// #include ../AbstractDialog.js
// #include ../../TransferFunctionWidget.js

// #include ../../../uispecs/renderers/IMCRendererDialog.json

class IMCRendererDialog extends AbstractDialog {

constructor(renderer, options) {
    super(UISPECS.IMCRendererDialog, options);

    this._renderer = renderer;
    this._hasIsoLayers = true;

    this._setInitialValues();

    this._handleChange = this._handleChange.bind(this);
    this._handleTFChange = this._handleTFChange.bind(this);
    this._handleChangeWithoutReset = this._handleChangeWithoutReset.bind(this);

    this._binds.steps.addEventListener('input', this._handleChangeWithoutReset);
    // this._binds.isovalue.addEventListener('change', this._handleChange);
    // this._binds.color.addEventListener('change', this._handleChange);
    this._binds.direction.addEventListener('input', this._handleChange);
    this._binds.shader_type.addEventListener('input', this._handleChange);
    this._binds.comp_type.addEventListener('input', this._handleChange);

    // this._binds.metalic.addEventListener('change', this._handleChange);
    // this._binds.f90.addEventListener('change', this._handleChange);
    // this._binds.specularWeight.addEventListener('change', this._handleChange);
    // this._binds.alphaRoughness.addEventListener('change', this._handleChange);

    this._binds.extinction.addEventListener('input', this._handleChange);
    this._binds.bias.addEventListener('change', this._handleChange);
    this._binds.ratio.addEventListener('change', this._handleChange);
    this._binds.bounces.addEventListener('input', this._handleChange);
    this._binds.mcm_steps.addEventListener('input', this._handleChangeWithoutReset);

    this._tfwidget = new TransferFunctionWidget();
    this._binds.tfcontainer.add(this._tfwidget);
    this._tfwidget.addEventListener('change', this._handleTFChange);
}

destroy() {
    this._tfwidget.destroy();
    super.destroy();
}

_setInitialValues() {
    this._renderer._stepsIso = this._binds.steps.getValue();
    this._renderer._compType = parseInt(this._binds.comp_type.getValue());
    this._renderer._shaderType = parseInt(this._binds.shader_type.getValue());
    const direction = this._binds.direction.getValue();
    this._renderer._light[0] = direction.x;
    this._renderer._light[1] = direction.y;
    this._renderer._light[2] = direction.z;

    const extinction = this._binds.extinction.getValue();
    const bias       = this._binds.bias.getValue();
    const ratio      = this._binds.ratio.getValue();
    const bounces    = this._binds.bounces.getValue();
    const steps      = this._binds.mcm_steps.getValue();

    this._renderer.extinctionScale = extinction;
    this._renderer.scatteringBias = bias;
    this._renderer.majorant = extinction * ratio;
    this._renderer.maxBounces = bounces;
    this._renderer.steps = steps;
}

_handleChange() {
    const direction = this._binds.direction.getValue();
    this._renderer._light[0] = direction.x;
    this._renderer._light[1] = direction.y;
    this._renderer._light[2] = direction.z;

    this._renderer._shaderType = parseInt(this._binds.shader_type.getValue());
    this._renderer._compType = parseInt(this._binds.comp_type.getValue());

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

_handleChangeIsoLayers(isoLayersGroups) {
    let isoLayers = [];
    for (let i = 0; i < isoLayersGroups.length; i++) {
        let isoLayerGroup = isoLayersGroups[i];

        if (!isoLayerGroup.enabled)
            continue
        let isoLayer = {};
        isoLayer.isovalue = isoLayerGroup.isovalue;

        isoLayer.alpha = isoLayerGroup.alpha;

        const metalic = isoLayerGroup.metalic;

        const color = CommonUtils.hex2rgb(isoLayerGroup.color);
        isoLayer.trueColor = [
            color.r,
            color.g,
            color.b
        ];
        isoLayer.color = [
            color.r * (1 - metalic),
            color.g * (1 - metalic),
            color.b * (1 - metalic)
        ];

        isoLayer.p = isoLayerGroup.p

        isoLayer.f0 = [
            0.04 * (1 - metalic) + color.r * metalic,
            0.04 * (1 - metalic) + color.g * metalic,
            0.04 * (1 - metalic) + color.b * metalic,
        ];

        const f90 = CommonUtils.hex2rgb(isoLayerGroup.f90);
        isoLayer.f90 = [
            f90.r,
            f90.g,
            f90.b
        ];

        isoLayer.specularWeight = isoLayerGroup.specularWeight;
        isoLayer.alphaRoughness = isoLayerGroup.alphaRoughness;
        isoLayers.push(isoLayer)
    }
    isoLayers.sort((a, b) => {
        return a.isovalue - b.isovalue;
    });
    // let accumulator = 0;
    // isoLayers.forEach((e) => {
    //     let trueAlpha = e.alpha *  (1 - accumulator);
    //     accumulator += (1.0 - accumulator) * e.alpha;
    //     console.log(`${e.isovalue} ${e.alpha} ${e.age}`);
    //     isoLayers.alpha = trueAlpha;
    // });
    this._renderer._isoLayers = isoLayers;
    this._renderer.reset();
}

_handleTFChange() {
    this._renderer.setTransferFunction(this._tfwidget.getTransferFunction());
    this._renderer.reset();
}

_handleChangeWithoutReset() {
    this._renderer._stepsIso = this._binds.steps.getValue();
    this._renderer.steps = this._binds.mcm_steps.getValue();
}

}
