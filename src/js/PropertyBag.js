export class PropertyBag extends EventTarget {

constructor() {
    super();

    this.properties = [];
}

registerProperties(properties) {
    this.properties.push(...properties);
}

}
