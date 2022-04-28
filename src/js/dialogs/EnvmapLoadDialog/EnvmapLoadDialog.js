import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./EnvmapLoadDialog.html', import.meta.url))
    .then(response => response.text());

export class EnvmapLoadDialog extends EventTarget {

constructor() {
    super();

    this.object = template.content.cloneNode(true);
    this.binds = DOMUtils.bind(this.object);

    this._handleTypeChange = this._handleTypeChange.bind(this);
    this._handleLoadClick = this._handleLoadClick.bind(this);
    this._handleFileChange = this._handleFileChange.bind(this);
    this._handleURLChange = this._handleURLChange.bind(this);
    this._handleDemoChange = this._handleDemoChange.bind(this);

    this._demos = [];

    this._addEventListeners();
    this._loadDemoJson();
}

_addEventListeners() {
    this.binds.type.addEventListener('change', this._handleTypeChange);
    this.binds.loadButton.addEventListener('click', this._handleLoadClick);
    this.binds.file.addEventListener('change', this._handleFileChange);
    this.binds.url.addEventListener('input', this._handleURLChange);
    this.binds.demo.addEventListener('change', this._handleDemoChange);
}

async _loadDemoJson() {
    try {
        const response = await fetch('demo-envmaps.json');
        this._demos = await response.json();
        this._demos.forEach(demo => {
            this.binds.demo.addOption(demo.value, demo.label);
        });
    } catch (e) {
        console.warn('demo-envmaps.json not available');
    }
}

_handleLoadClick() {
    switch (this.binds.type.value) {
        case 'file' : this._handleLoadFile(); break;
        case 'url'  : this._handleLoadURL();  break;
        case 'demo' : this._handleLoadDemo(); break;
    }
}

_handleLoadFile() {
    const files = this.binds.file.files;
    if (files.length === 0) {
        // update status bar?
        return;
    }
    const file = files[0];

    this.dispatchEvent(new CustomEvent('load', {
        detail: {
            type : 'file',
            file : file,
        }
    }));
}

_handleLoadURL() {
    const url = this.binds.url.value;
    this.dispatchEvent(new CustomEvent('load', {
        detail: {
            type : 'url',
            url  : url,
        }
    }));
}

_handleLoadDemo() {
    const demo = this.binds.demo.value;
    const found = this._demos.find(d => d.value === demo);
    this.dispatchEvent(new CustomEvent('load', {
        detail: {
            type : 'url',
            url  : found.url,
        }
    }));
}

_handleTypeChange() {
    // TODO: switching panel
    switch (this.binds.type.value) {
        case 'file':
            DOMUtils.show(this.binds.filePanel);
            DOMUtils.hide(this.binds.urlPanel);
            DOMUtils.hide(this.binds.demoPanel);
            break;
        case 'url':
            DOMUtils.hide(this.binds.filePanel);
            DOMUtils.show(this.binds.urlPanel);
            DOMUtils.hide(this.binds.demoPanel);
            break;
        case 'demo':
            DOMUtils.hide(this.binds.filePanel);
            DOMUtils.hide(this.binds.urlPanel);
            DOMUtils.show(this.binds.demoPanel);
            break;
    }
    this._updateLoadButtonAndProgressVisibility();
}

_handleFileChange() {
    this._updateLoadButtonAndProgressVisibility();
}

_handleURLChange() {
    this._updateLoadButtonAndProgressVisibility();
}

_handleDemoChange() {
    this._updateLoadButtonAndProgressVisibility();
}

_updateLoadButtonAndProgressVisibility() {
    switch (this.binds.type.value) {
        case 'file':
            const files = this.binds.file.files;
            DOMUtils.toggle(this.binds.loadButtonAndProgress, files.length !== 0);
            break;
        case 'url':
            const urlEmpty = this.binds.url.value === '';
            DOMUtils.toggle(this.binds.loadButtonAndProgress, !urlEmpty);
            break;
        case 'demo':
            const demo = this.binds.demo.value;
            console.log(demo);
            DOMUtils.toggle(this.binds.loadButtonAndProgress, !!demo);
            break;
    }
}

}
