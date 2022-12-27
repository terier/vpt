import { Transform } from './Transform.js';

export class Node {

constructor(options = {}) {
    this.children = [];
    this.parent = null;

    this.components = [
        new Transform({ node: this, ...options }),
    ];
}

addChild(node) {
    if (node.parent) {
        node.parent.removeChild(node);
    }

    this.children.push(node);
    node.parent = this;
}

removeChild(node) {
    const index = this.children.indexOf(node);
    if (index >= 0) {
        this.children.splice(index, 1);
        node.parent = null;
    }
}

traverse(before, after) {
    if (before) {
        before(this);
    }
    for (const child of this.children) {
        child.traverse(before, after);
    }
    if (after) {
        after(this);
    }
}

getComponent(type) {
    return this.components.find(component => component instanceof type);
}

get transform() {
    return this.getComponent(Transform);
}

}
