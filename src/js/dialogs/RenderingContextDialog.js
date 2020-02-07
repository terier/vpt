// #package js/main

// #include AbstractDialog.js

// #include ../../uispecs/RenderingContextDialog.json

class RenderingContextDialog extends AbstractDialog {

constructor(options) {
    super(UISPECS.RenderingContextDialog, options);

    this._handleResolutionChange = this._handleResolutionChange.bind(this);
    this._handleTransformationChange = this._handleTransformationChange.bind(this);
    this._handleFilterChange = this._handleFilterChange.bind(this);

    this._binds.resolution.addEventListener('change', this._handleResolutionChange);
    this._binds.scale.addEventListener('input', this._handleTransformationChange);
    this._binds.translation.addEventListener('input', this._handleTransformationChange);
    this._binds.filter.addEventListener('change', this._handleFilterChange);
}

_handleResolutionChange() {
    this.trigger('resolution', {
        resolution: this._binds.resolution.getValue()
    });
}

_handleTransformationChange() {
    this.trigger('transformation', {
        scale       : this._binds.scale.getValue(),
        translation : this._binds.translation.getValue()
    });
}

_handleFilterChange() {
    this.trigger('filter', {
        filter: this._binds.filter.isChecked() ? 'linear' : 'nearest'
    });
}

}
