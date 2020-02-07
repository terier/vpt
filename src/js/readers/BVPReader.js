// #package js/main

// #include AbstractReader.js
// #include ZIPReader.js

class BVPReader extends AbstractReader {

constructor(loader) {
    super(loader);

    this._metadata = null;
    this._zipReader = new ZIPReader(this._loader);
}

readMetadata(handlers) {
    this._zipReader.readFile('manifest.json', {
        onData: data => {
            const decoder = new TextDecoder('utf-8');
            const jsonString = decoder.decode(data);
            const json = JSON.parse(jsonString);
            this._metadata = json;
            handlers.onData && handlers.onData(json);
        }
    });
}

readBlock(block, handlers) {
    if (!this._metadata) {
        return;
    }

    const blockMeta = this._metadata.blocks[block];
    this._zipReader.readFile(blockMeta.url, {
        onData: data => {
            handlers.onData && handlers.onData(data);
        }
    });
}

}
