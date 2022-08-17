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
    this._handleFullscreenChange = this._handleFullscreenChange.bind(this);

    this.binds.resolution.addEventListener('change', this._handleResolutionChange);
    this.binds.translation.addEventListener('input', this._handleTransformationChange);
    this.binds.rotation.addEventListener('input', this._handleTransformationChange);
    this.binds.scale.addEventListener('input', this._handleTransformationChange);
    this.binds.filter.addEventListener('change', this._handleFilterChange);
    this.binds.fullscreen.addEventListener('change', this._handleFullscreenChange);
}

get resolution() {
    return this.binds.resolution.value;
}

get translation() {
    return this.binds.translation.value;
}

get rotation() {
    return this.binds.rotation.value;
}

get scale() {
    return this.binds.scale.value;
}

get filter() {
    return this.binds.filter.checked ? 'linear' : 'nearest';
}

get fullscreen() {
    return this.binds.fullscreen.checked;
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

_handleFullscreenChange() {
    this.dispatchEvent(new Event('fullscreen'));
}

}
