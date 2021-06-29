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
        this._handleChangeType = this._handleChangeType.bind(this);
        this._handleChangeScettering = this._handleChangeScettering.bind(this);
        this._handleChangeResetLightField = this._handleChangeResetLightField.bind(this);
        this._handleChangeRatio = this._handleChangeRatio.bind(this);
        this._handleTFChange = this._handleTFChange.bind(this);
        this._handleChangeLights = this._handleChangeLights.bind(this);
        this._handleChangeMCParameters = this._handleChangeMCParameters.bind(this);
        this._handleChangeSlowdown = this._handleChangeSlowdown.bind(this);
        this._handleChangeDeferredRendering = this._handleChangeDeferredRendering.bind(this);
        this._handleChangeDeNoise = this._handleChangeDeNoise.bind(this);

        // Renderer
        this._binds.steps.addEventListener('input', this._handleChange);
        this._binds.opacity.addEventListener('input', this._handleChange);
        this._binds.mc_enabled.addEventListener('change', this._handleChange);

        this._binds.scattering.addEventListener('input', this._handleChangeScettering);
        this._binds.diffusion_enabled.addEventListener('input', this._handleChangeScettering);
        this._binds.ratio.addEventListener('input', this._handleChangeRatio);
        this._binds.max_slowdown.addEventListener('input', this._handleChangeSlowdown);
        this._binds.limit.addEventListener('input', this._handleChange);
        this._binds.ratio.addEventListener('input', this._handleChangeRatio);

        // MC
        this._binds.majorant_ratio.addEventListener('change', this._handleChangeMCParameters);
        this._binds.extinction_MS.addEventListener('input', this._handleChangeMCParameters);
        this._binds.albedo_MS.addEventListener('change', this._handleChangeMCParameters);
        this._binds.bias_MS.addEventListener('change', this._handleChangeMCParameters);
        this._binds.bounces_MS.addEventListener('input', this._handleChangeMCParameters);
        this._binds.ray_steps.addEventListener('input', this._handleChange);
        this._binds.renderer_type.addEventListener('input', this._handleChangeType);

        // Deferred Rendering and De-Noise
        this._binds.deferred_enabled.addEventListener('change', this._handleChangeDeferredRendering);
        this._binds.sd_enabled.addEventListener('change', this._handleChangeDeNoise);
        this._binds.sd_sigma.addEventListener('input', this._handleChangeDeNoise);
        this._binds.sd_ksigma.addEventListener('input', this._handleChangeDeNoise);
        this._binds.sd_threshold.addEventListener('input', this._handleChangeDeNoise);

        // Transfer Function

        this._tfwidget = new TransferFunctionWidget();
        this._binds.tfcontainer.add(this._tfwidget);
        this._tfwidget.addEventListener('change', this._handleTFChange);
    }

    _setInitialValues() {
        this._renderer._scattering = this._binds.scattering.getValue();
        this._renderer._steps = this._binds.ray_steps.getValue();

        const extinction = this._binds.extinction_MS.getValue();
        const albedo     = this._binds.albedo_MS.getValue();
        const ratio      = this._binds.majorant_ratio.getValue();

        this._renderer._absorptionCoefficientMC = extinction * (1 - albedo);
        this._renderer._scatteringCoefficientMC = extinction * albedo;
        this._renderer._scatteringBias = this._binds.bias_MS.getValue();
        this._renderer._majorant = extinction * ratio;
        this._renderer._maxBounces = this._binds.bounces_MS.getValue();

        this._renderer._lightVolumeRatio = this._binds.ratio.getValue();
        this._renderer._mcEnabled = this._binds.mc_enabled.isChecked();
        this._renderer._diffusionEnabled = this._binds.diffusion_enabled.isChecked();
        this._renderer._type = parseInt(this._binds.renderer_type.getValue());

        this._renderer._deferredRendering = this._binds.deferred_enabled.isChecked();
        this._renderer._smartDeNoise = this._binds.sd_enabled.isChecked();
        this._renderer._smartDeNoiseSigma = this._binds.sd_sigma.getValue();
        this._renderer._smartDeNoiseKSigma = this._binds.sd_ksigma.getValue();
        this._renderer._smartDeNoiseThreshold = this._binds.sd_threshold.getValue();
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
            this._renderer.resetLightVolume();
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
    }

    _handleChangeType() {
        this._renderer._type = parseInt(this._binds.renderer_type.getValue());
        this._resetPhotons();
    }

    _handleChangeScettering() {
        this._renderer._scattering = this._binds.scattering.getValue();
        this._renderer._diffusionEnabled = this._binds.diffusion_enabled.isChecked();
        // if (this._renderer._volumeDimensions) {
            // this._renderer._resetDiffusion();
            // this._renderer.resetLightVolume();
        // }
    }

    _handleChangeMCParameters() {
        const extinction = this._binds.extinction_MS.getValue();
        const albedo     = this._binds.albedo_MS.getValue();
        const bias       = this._binds.bias_MS.getValue();
        const ratio      = this._binds.majorant_ratio.getValue();
        const bounces    = this._binds.bounces_MS.getValue();

        // console.log("Lala")

        // this._renderer._absorptionCoefficientMC = extinction;

        // this._renderer._majorant = this._binds.majorant_ratio.getValue() * extinction;

        this._renderer._absorptionCoefficientMC = extinction * (1 - albedo);
        this._renderer._scatteringCoefficientMC = extinction * albedo;
        this._renderer._scatteringBias = bias;
        this._renderer._majorant = extinction * ratio;
        this._renderer._maxBounces = bounces;

        this._renderer.resetLightVolume();
    }

    _handleChangeResetLightField() {
        this._renderer.resetLightVolume();
    }

    _handleChangeRatio() {
        this._renderer._lightVolumeRatio = this._binds.ratio.getValue();
        if (this._renderer._volumeDimensions) {
            this._renderer._setLightVolumeDimensions();
            this._renderer._setAccumulationBuffer();
            this._renderer.resetLightVolume();
        }
    }

    _handleChangeLights(lights) {
        console.log("Lights Reset")
        this._setLights(lights);
    }

    _handleChangeSlowdown() {
        this._renderer._allowedSlowdown = this._binds.max_slowdown.getValue();
        this._renderer._layersPerFrame = 1
        this._renderer._fastStart = true
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
        this._renderer.resetLightVolume()
    }
}
