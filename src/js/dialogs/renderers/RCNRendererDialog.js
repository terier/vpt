// #package js/main

// #include ../AbstractDialog.js
// #include ../../TransferFunctionWidget.js

// #include ../../../uispecs/renderers/RCNRendererDialog.json

class RCNRendererDialog extends AbstractDialog {

    constructor(renderer, options) {
        super(UISPECS.RCNRendererDialog, options);
        this._hasLights = true;

        this._renderer = renderer;

        this._setInitialValues();

        this._handleChange = this._handleChange.bind(this);
        this._handleChangeScettering = this._handleChangeScettering.bind(this);
        this._handleChangeResetLightField = this._handleChangeResetLightField.bind(this);
        this._handleChangeRatio = this._handleChangeRatio.bind(this);
        this._handleTFChange = this._handleTFChange.bind(this);
        // this._handleChangeLights = this._handleChangeLights.bind(this);
        this._handleChangeResetLightFieldMC = this._handleChangeResetLightFieldMC.bind(this);

        // Renderer
        this._binds.steps.addEventListener('input', this._handleChange);
        this._binds.opacity.addEventListener('input', this._handleChange);
        this._binds.mc_enabled.addEventListener('change', this._handleChange);

        this._binds.scattering.addEventListener('input', this._handleChangeScettering);
        this._binds.ratio.addEventListener('input', this._handleChangeRatio);

        // MC
        this._binds.majorant_ratio.addEventListener('change', this._handleChangeResetLightFieldMC);
        this._binds.extinction.addEventListener('input', this._handleChangeResetLightFieldMC);
        this._binds.ray_steps.addEventListener('input', this._handleChange);

        this._binds.limit.addEventListener('input', this._handleChange);
        this._tfwidget = new TransferFunctionWidget();
        this._binds.tfcontainer.add(this._tfwidget);
        this._tfwidget.addEventListener('change', this._handleTFChange);
    }

    _setInitialValues() {
        this._renderer._scattering = this._binds.scattering.getValue();

        this._renderer._steps = this._binds.ray_steps.getValue();

        const extinction = this._binds.extinction.getValue();
        
        this._renderer._absorptionCoefficientMC = extinction;

        this._renderer._majorant = this._binds.majorant_ratio.getValue() * extinction;

        this._renderer._lightVolumeRatio = this._binds.ratio.getValue();

        this._renderer._mcEnabled = this._binds.mc_enabled.isChecked();
    }

    _setLights(lights) {
        let doReset = false;
        const renderer = this._renderer;
        const oldLightDefinitions = renderer._lightDefinitions;
        renderer._lightDefinitions = [];
        for (let i = 0; i < lights.length; i++) {
            let light = lights[i];
            let oldLightDefinition = oldLightDefinitions[i];
            let lightDefinition = new LightDefinition(
                light.type,
                [light.dirpos.x / 100, light.dirpos.y / 100, light.dirpos.z / 100],
                light.enabled
            )
            renderer._lightDefinitions[i] = lightDefinition;
            if (renderer._volumeDimensions &&
                lightDefinition.isOrWasEnabled(oldLightDefinition) &&
                lightDefinition.hasChanged(oldLightDefinition)) {
                doReset = true;
            }
        }
        if (doReset) {
            this._renderer._setLightTexture();
            this._renderer._resetPhotons();
        }
    }

    destroy() {
        this._tfwidget.destroy();
        super.destroy();
    }

    _handleChange() {
        this._renderer._stepSize = 1 / this._binds.steps.getValue();
        this._renderer._alphaCorrection = this._binds.opacity.getValue();
        this._renderer._steps = this._binds.ray_steps.getValue();
        this._renderer._limit = this._binds.limit.getValue();
        this._renderer._mcEnabled = this._binds.mc_enabled.isChecked();
        this._renderer.reset();
    }

    _handleChangeScettering() {
        this._renderer._scattering = this._binds.scattering.getValue();

        this._renderer._resetDiffusion();
        this._renderer.reset();
    }

    _handleChangeResetLightFieldMC() {
        const extinction = this._binds.extinction.getValue();

        this._renderer._absorptionCoefficientMC = extinction;

        this._renderer._majorant = this._binds.majorant_ratio.getValue() * extinction;

        this._renderer._resetPhotons();
        this._renderer.reset();
    }

    _handleChangeResetLightField() {
        this._renderer._limit = this._binds.limit.getValue();
        this._renderer._resetPhotons();
        this._renderer.reset();
    }

    _handleChangeRatio() {
        this._renderer._lightVolumeRatio = this._binds.ratio.getValue();
        if (this._renderer._volumeDimensions) {
            this._renderer._setLightVolumeDimensions();
            this._renderer._setAccumulationBuffer();
            this._renderer._resetPhotons();
            this._renderer.reset();
        }
    }

    _handleChangeLights(lights) {
        console.log("Lights Reset")
        this._setLights(lights);
        this._renderer.reset();
    }

    _handleTFChange() {

        this._renderer.setTransferFunction(this._tfwidget.getTransferFunction());
        if (this._renderer._type === 1)
            this._renderer._resetLightField();
        this._renderer.reset();
    }

}
