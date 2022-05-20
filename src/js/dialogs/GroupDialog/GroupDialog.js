import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./GroupDialog.html', import.meta.url))
    .then(response => response.text());

const groupTemplate = document.createElement('template');
groupTemplate.innerHTML = await fetch(new URL('./Group.html', import.meta.url))
    .then(response => response.text());

const predicateTemplate = document.createElement('template');
predicateTemplate.innerHTML = await fetch(new URL('./Predicate.html', import.meta.url))
    .then(response => response.text());

export class GroupDialog extends EventTarget {

constructor() {
    super();

    this.object = template.content.cloneNode(true);
    this.binds = DOMUtils.bind(this.object);

    this.binds.addGroup.addEventListener('click', e => this.addGroup());

    this.attributes = [];
}

addGroup() {
    const fragment = groupTemplate.content.cloneNode(true);
    const binds = DOMUtils.bind(fragment);

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

    // add predicate
    binds.addPredicate.addEventListener('click', e => {
        this.addPredicate(binds);
    });

    this.binds.groups.appendChild(fragment);
}

addPredicate(groupBinds) {
    const fragment = predicateTemplate.content.cloneNode(true);
    const binds = DOMUtils.bind(fragment);

    // attributes
    for (const attribute of this.attributes) {
        const option = document.createElement('option');
        option.value = attribute;
        option.textContent = attribute;
        binds.attribute.appendChild(option);
    }

    // draggable
    binds.move.addEventListener('pointerdown', e => {
        binds.predicate.setAttribute('draggable', 'true');
    });
    binds.predicate.addEventListener('dragend', e => {
        if (e.target !== binds.predicate) return;
        binds.predicate.setAttribute('draggable', 'false');
    });
    binds.predicate.addEventListener('dragstart', e => {
        if (e.target !== binds.predicate) return;
    });

    // delete
    binds.delete.addEventListener('click', e => {
        binds.predicate.remove();
    });

    groupBinds.predicates.appendChild(fragment);
}

}
