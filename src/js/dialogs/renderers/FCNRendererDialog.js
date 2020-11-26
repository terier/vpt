// #package js/main

// #include ../AbstractDialog.js
// #include ../../TransferFunctionWidget.js

// #include ../../../uispecs/renderers/FCNRendererDialog.json

class FCNRendererDialog extends AbstractDialog {

    constructor(renderer, options) {
        super(UISPECS.FCNRendererDialog, options);
        this._hasLights = true;

        this._renderer = renderer;

        this._setInitialValues();

        this._handleChange = this._handleChange.bind(this);
        this._handleChangeScettering = this._handleChangeScettering.bind(this);
        this._handleChangeResetLightField = this._handleChangeResetLightField.bind(this);
        this._handleChangeRatio = this._handleChangeRatio.bind(this);
        this._handleTFChange = this._handleTFChange.bind(this);
        // this._handleChangeLights = this._handleChangeLights.bind(this);

        this._binds.steps.addEventListener('input', this._handleChange);
        this._binds.opacity.addEventListener('input', this._handleChange);
        // this._binds.lightType.addEventListener('input', this._handleChangeResetLightField);
        // this._binds.direction.addEventListener('input', this._handleChangeResetLightField);
        this._binds.scattering.addEventListener('input', this._handleChangeScettering);
        this._binds.absorptionCoefficient.addEventListener('input', this._handleChange);
        this._binds.ratio.addEventListener('input', this._handleChangeRatio);
        this._binds.repeats.addEventListener('input', this._handleChangeResetLightField);
        this._binds.convectionSteps.addEventListener('input', this._handleChangeResetLightField);

        this._tfwidget = new TransferFunctionWidget();
        this._binds.tfcontainer.add(this._tfwidget);
        this._tfwidget.addEventListener('change', this._handleTFChange);
    }

    _setInitialValues() {
        this._renderer._stepSize = 1 / this._binds.steps.getValue();
        this._renderer._alphaCorrection = this._binds.opacity.getValue();
        this._renderer._absorptionCoefficient = this._binds.absorptionCoefficient.getValue();
        this._renderer._scattering = this._binds.scattering.getValue();

        this._renderer._convectionLimit = this._binds.repeats.getValue();
        this._renderer._convectionSteps = this._binds.convectionSteps.getValue();
        this._renderer._lightVolumeRatio = this._binds.ratio.getValue();

    }

    destroy() {
        this._tfwidget.destroy();
        super.destroy();
    }

    _handleChange() {
        this._renderer._stepSize = 1 / this._binds.steps.getValue();
        this._renderer._alphaCorrection = this._binds.opacity.getValue();
        this._renderer._absorptionCoefficient = this._binds.absorptionCoefficient.getValue();

        this._renderer.reset();
    }

    _handleChangeScettering() {
        this._renderer._scattering = this._binds.scattering.getValue();
        // if (this._renderer._volumeDimensions) {
        //     this._renderer._resetDiffusionField();
        // }

        this._renderer.reset();
    }

    _handleChangeResetLightField() {
        this._renderer._convectionLimit = this._binds.repeats.getValue();

        this._renderer._convectionSteps = this._binds.convectionSteps.getValue();
        // if (this._renderer._volumeDimensions) {
        //     this._renderer._resetLightField();
        // }

        this._renderer.reset();
    }

    _handleChangeRatio() {
        this._renderer._lightVolumeRatio = this._binds.ratio.getValue();
        // if (this._renderer._volumeDimensions) {
        //     this._renderer._setLightVolumeDimensions();
        //     this._renderer._resetLightField();
        //     this._renderer.reset();
        // }
    }

    _handleChangeLights(lights) {
        // console.log("Change")
        // if (this._renderer._lightToggling === 0) {
        //     this._setLightsSimple();
        // } else {
        //     this._setLights(lights);
        // }
        this._renderer.reset();
    }

    _setLightsSimple() {
        // let lightDefinitions = [];
        let doReset = false;
        const renderer = this._renderer;
        const oldLightDefinitions = renderer._lightDefinitions;
        renderer._lightDefinitions = [];
        for (let i = 0; i < 100; i++) {
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
            this._renderer._resetLightField();
        }
    }

    _setLights(lights) {
        // let lightDefinitions = [];
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
            this._renderer._lightDefinitions[i] = lightDefinition;
            // console.log(lightDefinition)
            if (!lightDefinition.isEnabled() && this._renderer._lightVolumes[i]) {
                this._renderer._removeLightDensity(i);
                this._renderer._lightVolumes[i].deleteTexture();
                this._renderer._lightVolumes[i] = null;
            }
            else if (
                this._renderer._volumeDimensions &&
                lightDefinition.isEnabled() &&
                lightDefinition.hasChanged(oldLightDefinition)) {
                this._renderer._removeLightDensity(i);
                this._renderer._resetLightVolume(i);
            }
        }
        if (renderer._lightVolumes.length > lights.length) {
            for (let i = lights.length; i < renderer._lightVolumes.length; i++) {
                let lightVolume = renderer._lightVolumes[i];
                if (lightVolume) {
                    this._renderer._removeLightDensity(i);
                    lightVolume.deleteTexture();
                }

            }
            this._renderer._lightVolumes.length = lights.length;
        }
        // console.log(this._renderer._lightDefinitions)
        // this._renderer._lightDefinitions = lightDefinitions;
    }

    _handleTFChange() {
        this._renderer.setTransferFunction(this._tfwidget.getTransferFunction());
        this._renderer.reset();
    }

}
