// #part /js/readers/AbstractReader

class AbstractReader {

constructor(loader) {
    this._loader = loader;
}

async readMetadata() {
    // IMPLEMENT
}

async readBlock(block) {
    // IMPLEMENT
}

}
