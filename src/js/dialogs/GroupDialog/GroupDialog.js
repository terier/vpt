import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./GroupDialog.html', import.meta.url))
    .then(response => response.text());

const groupTemplate = document.createElement('template');
groupTemplate.innerHTML = await fetch(new URL('./Group.html', import.meta.url))
    .then(response => response.text());

export class GroupDialog extends EventTarget {

constructor() {
    super();

    this.object = template.content.cloneNode(true);
    this.binds = DOMUtils.bind(this.object);

    this.binds.addGroup.addEventListener('click', e => this.addGroup());

    this.groups = [];
}

addGroup() {
    this.groups.push({});
    const node = groupTemplate.content.cloneNode(true);
    this.binds.groups.appendChild(node);
}

}
