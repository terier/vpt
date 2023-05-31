export class Component extends EventTarget {

#node = null;

constructor(node) {
    super();

    this.#node = node;
}

get node() {
    return this.#node;
}

start() {}
update() {}
render() {}
resize() {}

}
