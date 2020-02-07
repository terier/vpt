// #package js/main

// #include ../AbstractDialog.js

// #include ../../../uispecs/tonemappers/ArtisticToneMapperDialog.json

class ArtisticToneMapperDialog extends AbstractDialog {

constructor(toneMapper, options) {
    super(UISPECS.ArtisticToneMapperDialog, options);

    this._toneMapper = toneMapper;

    this._handleChange = this._handleChange.bind(this);

    this._binds.low.addEventListener('input', this._handleChange);
    this._binds.high.addEventListener('input', this._handleChange);
    this._binds.saturation.addEventListener('input', this._handleChange);
    this._binds.midtones.addEventListener('change', this._handleChange);
}

_handleChange() {
    const low = this._binds.low.getValue();
    const high = this._binds.high.getValue();
    const midtones = this._binds.midtones.getValue();
    const saturation = this._binds.saturation.getValue();

    this._toneMapper.low = low;
    this._toneMapper.mid = low + (1 - midtones) * (high - low);
    this._toneMapper.high = high;
    this._toneMapper.saturation = saturation;
}

}
