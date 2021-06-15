// #part /js/readers/AbstractReader

class AbstractReader {

constructor(loader) {
    this._loader = loader;
}

readMetadata(handlers) {
    // IMPLEMENT
}

readBlock(block, handlers) {
    // IMPLEMENT
}

}
