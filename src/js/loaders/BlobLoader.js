import { AbstractLoader } from './AbstractLoader.js';

export class BlobLoader extends AbstractLoader {

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
