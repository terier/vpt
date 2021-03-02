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
        this._handleChangeDeferredRendering = this._handleChangeDeferredRendering.bind(this);
        this._handleChangeDeNoise = this._handleChangeDeNoise.bind(this);

        this._binds.steps.addEventListener('input', this._handleChange);
        this._binds.opacity.addEventListener('input', this._handleChange);
        // this._binds.lightType.addEventListener('input', this._handleChangeResetLightField);
        // this._binds.direction.addEventListener('input', this._handleChangeResetLightField);
        this._binds.scattering.addEventListener('input', this._handleChangeScettering);
        this._binds.absorptionCoefficient.addEventListener('input', this._handleChange);
        this._binds.ratio.addEventListener('input', this._handleChangeRatio);
        this._binds.repeats.addEventListener('input', this._handleChangeResetLightField);
        this._binds.convectionSteps.addEventListener('input', this._handleChange);
        this._binds.time_step.addEventListener('input', this._handleChange);

        // Deferred Rendering and De-Noise
        this._binds.deferred_enabled.addEventListener('change', this._handleChangeDeferredRendering);
        this._binds.sd_enabled.addEventListener('change', this._handleChangeDeNoise);
        this._binds.sd_sigma.addEventListener('input', this._handleChangeDeNoise);
        this._binds.sd_ksigma.addEventListener('input', this._handleChangeDeNoise);
        this._binds.sd_threshold.addEventListener('input', this._handleChangeDeNoise);

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

        this._renderer._deferredRendering = this._binds.deferred_enabled.isChecked();
        this._renderer._smartDeNoise = this._binds.sd_enabled.isChecked();
        this._renderer._smartDeNoiseSigma = this._binds.sd_sigma.getValue();
        this._renderer._smartDeNoiseKSigma = this._binds.sd_ksigma.getValue();
        this._renderer._smartDeNoiseThreshold = this._binds.sd_threshold.getValue();
    }

    destroy() {
        this._tfwidget.destroy();
        super.destroy();
    }

    _handleChange() {
        this._renderer._stepSize = 1 / this._binds.steps.getValue();
        this._renderer._alphaCorrection = this._binds.opacity.getValue();
        this._renderer._absorptionCoefficient = this._binds.absorptionCoefficient.getValue();
        this._renderer._timeStep = this._binds.time_step.getValue();
        this._renderer._convectionSteps = this._binds.convectionSteps.getValue();
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
        if (this._renderer._volumeDimensions) {
            this._renderer._resetLightVolume();
        }

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
        this._setLightsSimple(lights);
        // if (this._renderer._lightToggling === 0) {
        //     this._setLightsSimple();
        // } else {
        //     this._setLights(lights);
        // }
        this._renderer.reset();
    }

    _setLightsSimple(lights) {
        // let lightDefinitions = [];
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
            // console.log("Reset Light Volume")
            this._renderer._setAccumulationBuffer();
            this._renderer._resetLightVolume();
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

    _handleChangeDeferredRendering() {
        const deferredRendering = this._binds.deferred_enabled.isChecked();
        if (deferredRendering && !this._renderer._defferedRenderBuffer)
            this._renderer._buildDeferredRenderBuffer();
        else if (!deferredRendering && this._renderer._deferredRendering)
            this._renderer._destroyDeferredRenderBuffer();
        this._renderer._deferredRendering = deferredRendering;
    }

    _handleChangeDeNoise() {
        this._renderer._smartDeNoise = this._binds.sd_enabled.isChecked();
        this._renderer._smartDeNoiseSigma = this._binds.sd_sigma.getValue();
        this._renderer._smartDeNoiseKSigma = this._binds.sd_ksigma.getValue();
        this._renderer._smartDeNoiseThreshold = this._binds.sd_threshold.getValue();
    }

    _handleTFChange() {
        this._renderer.setTransferFunction(this._tfwidget.getTransferFunction());
        this._renderer.reset();
    }

}
