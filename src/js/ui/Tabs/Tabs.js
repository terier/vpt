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

    this.tabs = [];
    this.index = 0;
}

add(name, object) {
    const panel = document.createElement('div');
    const header = document.createElement('div');
    const index = this.tabs.length;

    header.textContent = name || ('Tab ' + (index + 1));
    this.tabs.push({
        object : object,
        header : header,
        panel  : panel
    });
    this.binds.container.appendChild(panel);
    this.binds.headers.appendChild(header);
    object.appendTo(panel);

    panel.style.order = index;
    header.style.order = index;

    header.classList.add('header');
    header.addEventListener('click', this.clickListener);

    this._updateStyle();
}

indexOfTab(tab) {
    for (let i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].header === tab ||
            this.tabs[i].panel === tab ||
            this.tabs[i].object === tab)
        {
            return i;
        }
    }
    return -1;
}

selectTab(objectOrIndex) {
    const len = this.tabs.length;
    if (len === 0) {
        return;
    }

    let index;
    if (typeof objectOrIndex === 'number') {
        index = ((objectOrIndex % len) + len) % len;
    } else {
        index = this.indexOfTab(objectOrIndex);
    }

    if (index >= 0 && index <= len) {
        this.index = index;
        this._updateStyle();
    }
}

_updateStyle() {
    for (let i = 0; i < this.tabs.length; i++) {
        const tab = this.tabs[i];
        const offset = -this.index * 100;
        tab.panel.style.left = offset + '%';
        if (i === this.index) {
            tab.header.classList.add('selected');
            tab.panel.classList.add('selected');
        } else {
            tab.header.classList.remove('selected');
            tab.panel.classList.remove('selected');
        }
    }
}

clickListener(e) {
    const index = this.indexOfTab(e.target);
    if (index >= 0) {
        this.selectTab(index);
    }
}

}

customElements.define('ui-tabs', Tabs);
