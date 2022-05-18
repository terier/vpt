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
}

addGroup() {
    const node = groupTemplate.content.cloneNode(true);
    const binds = DOMUtils.bind(node);

    // draggable
    binds.move.addEventListener('pointerdown', e => {
        binds.accordion.setAttribute('draggable', 'true');
    });
    binds.accordion.addEventListener('dragend', e => {
        if (e.target !== binds.accordion) return;
        binds.accordion.setAttribute('draggable', 'false');
    });
    binds.accordion.addEventListener('dragstart', e => {
        if (e.target !== binds.accordion) return;
    });

    // delete
    binds.delete.addEventListener('click', e => {
        binds.accordion.remove();
    });

    // rename
    binds.name.addEventListener('change', e => {
        binds.label.textContent = binds.name.value;
    });

    this.binds.groups.appendChild(node);
}

}
