import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./FileChooser.html', import.meta.url))
    .then(response => response.text());

export class FileChooser extends HTMLElement {

constructor() {
    super();

    this.changeListener = this.changeListener.bind(this);
    this.clickListener = this.clickListener.bind(this);

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);

    this.addEventListener('click', this.clickListener);
    this.binds.input.addEventListener('change', this.changeListener);
}

changeListener() {
    if (this.binds.input.files.length > 0) {
        const fileName = this.binds.input.files[0].name;
        this.binds.label.textContent = fileName;
    } else {
        this.binds.label.textContent = '';
    }
    this.dispatchEvent(new Event('change'));
}

clickListener() {
    this.binds.input.click();
}

get files() {
    return this.binds.input.files;
}

get value() {
    return this.files;
}

}

customElements.define('ui-file-chooser', FileChooser);
