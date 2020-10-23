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
        let metadata = {
            meta: {
                version: 1
            },
            modalities: [
                {
                    name: 'default',
                    dimensions: {
                        width  : this.width,
                        height : this.height,
                        depth  : this.depth
                    },
                    transform: {
                        matrix: [
                            1, 0, 0, 0,
                            0, 1, 0, 0,
                            0, 0, 1, 0,
                            0, 0, 0, 1
                        ]
                    },
                    format: 6403, // gl.RED
                    internalFormat: 33321, // gl.R8
                    type: 5125, // gl.UNSIGNED_INT
                    placements: []
                }
            ],
            blocks: []
        };
     
        for (let i = 0; i < this.depth; i++) {
            metadata.modalities[0].placements.push({
                index: i,
                position: { x: 0, y: 0, z: i }
            });
     
            metadata.blocks.push({
                url: 'default',
                format: 'raw',
                dimensions: {
                    width  : this.width,
                    height : this.height,
                    depth  : 1
                }
            });
        }
     
        handlers.onData && handlers.onData(metadata);
    }
     
    readBlock(block, handlers) {
        const sliceBytes = this.width * this.height * (this.bits / 8);
        const start = block * sliceBytes;
        const end = (block + 1) * sliceBytes;
        this._loader.readData(start, end, {
            onData: data => {
                handlers.onData && handlers.onData(data);
            }
        });
    }
     
    }