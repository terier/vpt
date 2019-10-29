//@@../utils

class AbstractReader {

constructor(loader) {
    this._loader = loader;
}

readMetadata(handlers) {
    throw CommonUtils.noimpl;
}

readBlock(block, handlers) {
    throw CommonUtils.noimpl;
}

}
