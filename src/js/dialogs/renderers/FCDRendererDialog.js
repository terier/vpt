// #package js/main

// #include ../AbstractDialog.js
// #include ../../TransferFunctionWidget.js

// #include ../../../uispecs/renderers/FCDRendererDialog.json

class FCDRendererDialog extends AbstractDialog {

    constructor(renderer, options) {
        super(UISPECS.FCDRendererDialog, options);

        this._renderer = renderer;

        this._setInitialValues();

        this._handleChange = this._handleChange.bind(this);
        this._handleChangeScettering = this._handleChangeScettering.bind(this);
        this._handleChangeResetLightField = this._handleChangeResetLightField.bind(this);
        this._handleChangeRatio = this._handleChangeRatio.bind(this);
        this._handleTFChange = this._handleTFChange.bind(this);
        this._handleChangeLights = this._handleChangeLights.bind(this);

        this._binds.steps.addEventListener('input', this._handleChange);
        this._binds.opacity.addEventListener('input', this._handleChange);
        // this._binds.lightType.addEventListener('input', this._handleChangeResetLightField);
        // this._binds.direction.addEventListener('input', this._handleChangeResetLightField);
        this._binds.scattering.addEventListener('input', this._handleChangeScettering);
        this._binds.absorptionCoefficient.addEventListener('input', this._handleChange);
        this._binds.ratio.addEventListener('input', this._handleChangeRatio);
        this._binds.repeats.addEventListener('input', this._handleChangeResetLightField);
        this._binds.convectionSteps.addEventListener('input', this._handleChangeResetLightField);

        this._setLightsBinds();

        this._tfwidget = new TransferFunctionWidget();
        this._binds.tfcontainer.add(this._tfwidget);
        this._tfwidget.addEventListener('change', this._handleTFChange);
    }

    _setLightsBinds() {
        for (let i = 1; i < 100; i++) {
            let name = "light" + i;
            if (this._binds[name + "_enabled"]) {
                this._binds[name + "_enabled"].addEventListener('change', this._handleChangeLights);
                this._binds[name + "_dirpos"].addEventListener('input', this._handleChangeLights);
                this._binds[name + "_type"].addEventListener('input', this._handleChangeLights);
            } else {
                break;
            }
        }
    }

    _setInitialValues() {
        this._renderer._stepSize = 1 / this._binds.steps.getValue();
        this._renderer._alphaCorrection = this._binds.opacity.getValue();
        this._renderer._absorptionCoefficient = this._binds.absorptionCoefficient.getValue();
        this._renderer._scattering = this._binds.scattering.getValue();

        // this._renderer._lightType = this._binds.lightType.getValue();
        // const direction = this._binds.direction.getValue();
        // this._renderer._light[0] = direction.x;
        // this._renderer._light[1] = direction.y;
        // this._renderer._light[2] = direction.z;
        this._setLights();
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

        this._renderer._resetDiffusionField();
        this._renderer.reset();
    }

    _handleChangeResetLightField() {
        // this._renderer._lightType = this._binds.lightType.getValue();
        //
        // const direction = this._binds.direction.getValue();
        // this._renderer._light[0] = direction.x;
        // this._renderer._light[1] = direction.y;
        // this._renderer._light[2] = direction.z;

        this._renderer._convectionLimit = this._binds.repeats.getValue();

        this._renderer._convectionSteps = this._binds.convectionSteps.getValue();

        this._renderer._resetLightField();
        this._renderer.reset();
    }

    _handleChangeRatio() {
        this._renderer._lightVolumeRatio = this._binds.ratio.getValue();
        if (this._renderer._volumeDimensions) {
            this._renderer._setLightVolumeDimensions();
            this._renderer._resetLightField();
            this._renderer.reset();
        }
    }

    _handleChangeLights() {
        // console.log("Change")
        if (this._renderer._lightToggling === 0) {
            this._setLightsSimple();
        } else {
            this._setLights();
        }
        this._renderer.reset();
    }

    _setLightsSimple() {
        // let lightDefinitions = [];
        let hasChanged = false;
        for (let i = 0; i < 100; i++) {
            let name = "light" + (i + 1);
            if (this._binds[name + "_enabled"]) {
                let oldLightDefinition = this._renderer._lightDefinitions[i];
                let dirpos = this._binds[name + "_dirpos"].getValue();
                let lightDefinition = new LightDefinition(
                    this._binds[name + "_type"].getValue(),
                    [dirpos.x / 100, dirpos.y / 100, dirpos.z / 100],
                    this._binds[name + "_enabled"].isChecked()
                )
                this._renderer._lightDefinitions[i] = lightDefinition;
                if (this._renderer._volumeDimensions &&
                    (lightDefinition.isEnabled() || (oldLightDefinition && oldLightDefinition.isEnabled())) &&
                    lightDefinition.hasChanged(oldLightDefinition)) {
                    hasChanged = true;
                }
            } else {
                break;
            }
        }
        if (hasChanged) {
            this._renderer._resetLightField();
        }
    }

    _setLights() {
        // let lightDefinitions = [];
        for (let i = 0; i < 100; i++) {
            let name = "light" + (i + 1);
            if (this._binds[name + "_enabled"]) {
                let oldLightDefinition = this._renderer._lightDefinitions[i];
                let dirpos = this._binds[name + "_dirpos"].getValue();
                let lightDefinition = new LightDefinition(
                    this._binds[name + "_type"].getValue(),
                    [dirpos.x / 100, dirpos.y / 100, dirpos.z / 100],
                    this._binds[name + "_enabled"].isChecked()
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
            } else {
                break;
            }
        }
        // console.log(this._renderer._lightDefinitions)
        // this._renderer._lightDefinitions = lightDefinitions;
    }

    _handleTFChange() {
        this._renderer.setTransferFunction(this._tfwidget.getTransferFunction());
        this._renderer.reset();
    }

}
