import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./RenderingContextDialog.html', import.meta.url))
    .then(response => response.text());

export class RenderingContextDialog extends EventTarget {

constructor() {
    super();

    this.object = template.content.cloneNode(true);
    this.binds = DOMUtils.bind(this.object);

    this._handleResolutionChange = this._handleResolutionChange.bind(this);
    this._handleTransformationChange = this._handleTransformationChange.bind(this);
    this._handleFilterChange = this._handleFilterChange.bind(this);

    this.binds.resolution.addEventListener('change', this._handleResolutionChange);
    this.binds.scale.addEventListener('input', this._handleTransformationChange);
    this.binds.translation.addEventListener('input', this._handleTransformationChange);
    this.binds.filter.addEventListener('change', this._handleFilterChange);
}

get resolution() {
    return this.binds.resolution.value;
}

get scale() {
    return this.binds.scale.value;
}

get translation() {
    return this.binds.translation.value;
}

get filter() {
    return this.binds.filter.checked ? 'linear' : 'nearest';
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
