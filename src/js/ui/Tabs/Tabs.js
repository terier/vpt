import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./Tabs.html', import.meta.url))
    .then(response => response.text());

export class Tabs extends HTMLElement {

constructor() {
    super();

    this.clickListener = this.clickListener.bind(this);

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);

    // TODO: this should be done on every mutation
    for (const header of this.binds.headers.assignedElements()) {
        header.addEventListener('click', this.clickListener);
    }

    this.selectTab(0);
}

selectTab(index) {
    const tabs = this.binds.tabs.assignedElements();

    if (index < 0 || index >= tabs.length) {
        throw new Error('Tab index out of range');
    }

    this.index = index;
    this._updateStyle();
}

_updateStyle() {
    const tabs = this.binds.tabs.assignedElements();
    const headers = this.binds.headers.assignedElements();

    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.toggle('selected', i === this.index);
        tabs[i].classList.toggle('invisible', i !== this.index);
        headers[i].classList.toggle('selected', i === this.index);
    }
}

clickListener(e) {
    const headers = this.binds.headers.assignedElements();
    const index = headers.indexOf(e.target);
    this.selectTab(index);
}

}

customElements.define('ui-tabs', Tabs);
