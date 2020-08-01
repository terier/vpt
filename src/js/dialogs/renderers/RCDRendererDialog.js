// #package js/main

// #include ../AbstractDialog.js
// #include ../../TransferFunctionWidget.js

// #include ../../../uispecs/renderers/RCDRendererDialog.json

class RCDRendererDialog extends AbstractDialog {

    constructor(renderer, options) {
        super(UISPECS.RCDRendererDialog, options);

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
        this._binds.scattering.addEventListener('input', this._handleChangeScettering);
        this._binds.absorptionCoefficient.addEventListener('input', this._handleChange);
        this._binds.ratio.addEventListener('input', this._handleChangeRatio);

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
        // this._setLights();
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
        // this._setLights();
        this._renderer.reset();
    }

    _handleTFChange() {
        this._renderer.setTransferFunction(this._tfwidget.getTransferFunction());
        this._renderer.reset();
    }

}
