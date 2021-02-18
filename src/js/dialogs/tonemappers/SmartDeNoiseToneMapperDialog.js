// #package js/main

// #include ../AbstractDialog.js

// #include ../../../uispecs/tonemappers/SmartDeNoiseToneMapperDialog.json

class SmartDeNoiseToneMapperDialog extends AbstractDialog {

constructor(toneMapper, options) {
    super(UISPECS.SmartDeNoiseToneMapperDialog, options);

    this._toneMapper = toneMapper;

    this._handleChange = this._handleChange.bind(this);

    this._binds.low.addEventListener('input', this._handleChange);
    this._binds.high.addEventListener('input', this._handleChange);
    this._binds.saturation.addEventListener('input', this._handleChange);
    this._binds.midtones.addEventListener('change', this._handleChange);

    this._binds.de_noise_sigma.addEventListener('input', this._handleChange);
    this._binds.de_noise_ksigma.addEventListener('input', this._handleChange);
    this._binds.de_noise_threshold.addEventListener('input', this._handleChange);
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

    this._toneMapper.sigma = this._binds.de_noise_sigma.getValue();
    this._toneMapper.kSigma = this._binds.de_noise_ksigma.getValue();
    this._toneMapper.treshold = this._binds.de_noise_threshold.getValue();
}

}
