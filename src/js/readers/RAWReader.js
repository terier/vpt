import { AbstractReader } from './AbstractReader.js';

export class RAWReader extends AbstractReader {

constructor(loader, options) {
    super(loader);

    Object.assign(this, {
        width  : 0,
        height : 0,
        depth  : 0,
    }, options);
}

async readMetadata() {
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
                format: 6403,
                internalFormat: 33321,
                type: 5121,
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

    return metadata;
}

async readBlock(block) {
    const sliceBytes = this.width * this.height;
    const start = block * sliceBytes;
    const end = (block + 1) * sliceBytes;
    return await this._loader.readData(start, end);
}

}
