// #package js/main

// #include AbstractReader.js

class RAWReader extends AbstractReader {

constructor(loader, options) {
    super(loader);

    Object.assign(this, {
        width  : 0,
        height : 0,
        depth  : 0,
        bits   : 8
    }, options);
}

readMetadata(handlers) {
    handlers.onData && handlers.onData({
        meta: {
            version: 1
        },
        modalities: [
            {
                name: 'default',
                dimensions: {
                    width: this.width,
                    height: this.height,
                    depth: this.depth
                },
                transform: {
                    matrix: [
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0, 1
                    ]
                },
                components: 1,
                bits: this.bits,
                placements: [
                    {
                        index: 0,
                        position: {
                            x: 0,
                            y: 0,
                            z: 0
                        }
                    }
                ]
            }
        ],
        blocks: [
            {
                url: 'default',
                format: 'raw',
                dimensions: {
                    width: this.width,
                    height: this.height,
                    depth: this.depth
                }
            }
        ]
    });
}

readBlock(block, handlers) {
    this._loader.readData(0, this.width * this.height * this.depth * (this.bits / 8), {
        onData: data => {
            handlers.onData && handlers.onData(data);
        }
    });
}

}
