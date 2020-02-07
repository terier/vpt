// #package js/main

// #include ../AbstractDialog.js

// #include ../../../uispecs/tonemappers/ReinhardToneMapperDialog.json

class ReinhardToneMapperDialog extends AbstractDialog {

constructor(toneMapper, options) {
    super(UISPECS.ReinhardToneMapperDialog, options);

    this._toneMapper = toneMapper;

    this._handleChange = this._handleChange.bind(this);

    this._binds.exposure.addEventListener('input', this._handleChange);
}

_handleChange() {
    this._toneMapper._exposure = this._binds.exposure.getValue();
}

}
