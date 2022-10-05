import { AbstractReader } from './AbstractReader.js';

export class SAFReader extends AbstractReader {

constructor(loader) {
    super(loader);

    this.manifest = null;
}

async readManifest() {
    if (this.manifest) {
        return;
    }

    const manifestSizeBuffer = await this._loader.readData(12, 16);
    const manifestSize = new DataView(manifestSizeBuffer).getUint32(0, true);
    const manifestBuffer = await this._loader.readData(16, 16 + manifestSize);
    this.manifest = JSON.parse(new TextDecoder().decode(manifestBuffer));

    let offset = 16 + manifestSize;
    for (const file of this.manifest) {
        file.offset = offset;
        offset += file.size;
    }
}

async readFile(fileName) {
    if (!this.manifest) {
        await this.readManifest();
    }

    const file = this.manifest.find(file => file.path === fileName);
    if (!file) {
        throw new Error(`SAFReader: file ${fileName} not in manifest`);
    }

    return await this._loader.readData(file.offset, file.offset + file.size);
}

}
