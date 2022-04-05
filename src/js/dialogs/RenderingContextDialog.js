import { AbstractDialog } from './AbstractDialog.js';

const spec = await fetch('./uispecs/RenderingContextDialog.json').then(response => response.json());

export class RenderingContextDialog extends AbstractDialog {

constructor(options) {
    super(spec, options);

    this._handleResolutionChange = this._handleResolutionChange.bind(this);
    this._handleTransformationChange = this._handleTransformationChange.bind(this);
    this._handleFilterChange = this._handleFilterChange.bind(this);

    this._binds.resolution.addEventListener('change', this._handleResolutionChange);
    this._binds.scale.addEventListener('input', this._handleTransformationChange);
    this._binds.translation.addEventListener('input', this._handleTransformationChange);
    this._binds.filter.addEventListener('change', this._handleFilterChange);
}

get resolution() {
    return this._binds.resolution.getValue();
}

get scale() {
    return this._binds.scale.getValue();
}

get translation() {
    return this._binds.translation.getValue();
}

get filter() {
    return this._binds.filter.isChecked() ? 'linear' : 'nearest';
}

_handleResolutionChange() {
    this.dispatchEvent(new Event('resolution'));
}

_handleTransformationChange() {
    this.dispatchEvent(new Event('transformation'));
}

_handleFilterChange() {
    this.dispatchEvent(new Event('filter'));
}

}
