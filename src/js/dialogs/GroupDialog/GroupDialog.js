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
        binds.accordion.classList.add('highlight-src');
    });
    binds.accordion.addEventListener('dragenter', e => {
        binds.accordion.classList.add('highlight-dst');
    });
    binds.accordion.addEventListener('drop', e => {
        const toMove = this.binds.groups.querySelector('ui-accordion.highlight-src');
        if (!toMove) return;

        const compare = binds.accordion.compareDocumentPosition(toMove);
        const following = compare & Node.DOCUMENT_POSITION_FOLLOWING;
        const referenceNode = following ? binds.accordion : binds.accordion.nextSibling;
        this.binds.groups.insertBefore(toMove, referenceNode);
    });

    // remove highlights
    binds.accordion.addEventListener('dragend', e => {
        binds.accordion.classList.remove('highlight-src');
        binds.accordion.classList.remove('highlight-dst');
    });
    binds.accordion.addEventListener('dragleave', e => {
        binds.accordion.classList.remove('highlight-dst');
    });
    binds.accordion.addEventListener('drop', e => {
        binds.accordion.classList.remove('highlight-src');
        binds.accordion.classList.remove('highlight-dst');
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
        binds.predicate.classList.add('highlight-src');
    });
    binds.predicate.addEventListener('dragenter', e => {
        binds.predicate.classList.add('highlight-dst');
    });
    binds.predicate.addEventListener('drop', e => {
        const toMove = groupBinds.predicates.querySelector('.predicate.highlight-src');
        if (!toMove) return;

        const compare = binds.predicate.compareDocumentPosition(toMove);
        const following = compare & Node.DOCUMENT_POSITION_FOLLOWING;
        const referenceNode = following ? binds.predicate : binds.predicate.nextSibling;
        groupBinds.predicates.insertBefore(toMove, referenceNode);
    });

    // remove highlights
    binds.predicate.addEventListener('dragend', e => {
        binds.predicate.classList.remove('highlight-src');
        binds.predicate.classList.remove('highlight-dst');
    });
    binds.predicate.addEventListener('dragleave', e => {
        binds.predicate.classList.remove('highlight-dst');
    });
    binds.predicate.addEventListener('drop', e => {
        binds.predicate.classList.remove('highlight-src');
        binds.predicate.classList.remove('highlight-dst');
    });

    // delete
    binds.delete.addEventListener('click', e => {
        binds.predicate.remove();
    });

    groupBinds.predicates.appendChild(fragment);
}

}
