// #part /js/loaders/BlobLoader

// #link AbstractLoader

class BlobLoader extends AbstractLoader {

constructor(blob) {
    super();

    this.blob = blob;
}

async readLength() {
    return this.blob.size;
}

async readData(start, end) {
    return await this.blob.slice(start, end).arrayBuffer();
}

}
