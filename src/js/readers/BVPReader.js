import { AbstractReader } from './AbstractReader.js';
import { ZIPReader } from './ZIPReader.js';

export class BVPReader extends AbstractReader {

constructor(loader) {
    super(loader);

    this._metadata = null;
    this._zipReader = new ZIPReader(this._loader);
}

async readMetadata() {
    const data = await this._zipReader.readFile('manifest.json');
    const decoder = new TextDecoder('utf-8');
    const jsonString = decoder.decode(data);
    const json = JSON.parse(jsonString);
    this._metadata = json;
    return this._metadata;
}

async readBlock(block) {
    if (!this._metadata) {
        await this.readMetadata();
    }

    const blockMeta = this._metadata.blocks[block];
    return await this._zipReader.readFile(blockMeta.url);
}

}
