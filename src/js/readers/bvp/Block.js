import { vec } from './vec.js';

export class Block {

    constructor(dimensions, format, data = null) {
        this.dimensions = dimensions;
        this.format = format;

        this.data = data !== null ? data : format.allocateDimensions(dimensions);
    }

    linearIndex3D([x, y, z], [w, h, d]) {
        return x + y * w + z * w * h;
    }

    *lexi3D([w, h, d]) {
        for (let z = 0; z < d; z++) {
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    yield [x, y, z];
                }
            }
        }
    }

    add3D([x, y, z], [u, v, w]) {
        return [x + u, y + v, z + w];
    }

    get(start, end) {
        const extent = vec.sub(end, start);

        if (vec.any(vec.gt(start, end))) {
            throw new Error('Start greater than end');
        }
        if (vec.any(vec.lt(start, vec.zeros(start.length)))) {
            throw new Error('Start out of bounds');
        }
        if (vec.any(vec.gt(end, this.dimensions))) {
            throw new Error('End out of bounds');
        }
        if (vec.any(vec.mod(start, this.format.microblockDimensions))) {
            throw new Error('Not on microblock boundary');
        }
        if (vec.any(vec.mod(extent, this.format.microblockDimensions))) {
            throw new Error('Not an integer number of microblocks');
        }

        const { microblockSize, microblockDimensions } = this.format;
        const microblockStart = vec.div(start, microblockDimensions);
        const microblockEnd = vec.div(end, microblockDimensions);
        const microblockCropExtent = vec.div(extent, microblockDimensions);
        const microblockFullExtent = vec.div(this.dimensions, microblockDimensions);

        const block = new Block(extent, this.format);
        const srcBytes = new Uint8Array(this.data);
        const dstBytes = new Uint8Array(block.data);
        for (const localMicroblockIndex of this.lexi3D(microblockCropExtent)) {
            const globalMicroblockIndex = this.add3D(localMicroblockIndex, microblockStart);
            const srcMicroblockIndex = this.linearIndex3D(globalMicroblockIndex, microblockFullExtent);
            const dstMicroblockIndex = this.linearIndex3D(localMicroblockIndex, microblockCropExtent);
            for (let i = 0; i < microblockSize; i++) {
                dstBytes[i + dstMicroblockIndex * microblockSize] = srcBytes[i + srcMicroblockIndex * microblockSize];
            }
        }
        return block;
    }

    set(offset, block) {
        const start = offset;
        const end = vec.add(offset, block.dimensions);
        const extent = vec.sub(end, start);

        if (this.format !== block.format) {
            throw new Error('Format mismatch');
        }
        if (vec.any(vec.gt(start, end))) {
            throw new Error('Start greater than end');
        }
        if (vec.any(vec.lt(start, vec.zeros(start.length)))) {
            throw new Error('Start out of bounds');
        }
        if (vec.any(vec.gt(end, this.dimensions))) {
            throw new Error('End out of bounds');
        }
        if (vec.any(vec.mod(start, this.format.microblockDimensions))) {
            throw new Error('Not on microblock boundary');
        }
        if (vec.any(vec.mod(extent, this.format.microblockDimensions))) {
            throw new Error('Not an integer number of microblocks');
        }

        const { microblockSize, microblockDimensions } = this.format;
        const microblockStart = vec.div(start, microblockDimensions);
        const microblockEnd = vec.div(end, microblockDimensions);
        const microblockCropExtent = vec.div(extent, microblockDimensions);
        const microblockFullExtent = vec.div(this.dimensions, microblockDimensions);

        const srcBytes = new Uint8Array(block.data);
        const dstBytes = new Uint8Array(this.data);
        for (const localMicroblockIndex of this.lexi3D(microblockCropExtent)) {
            const globalMicroblockIndex = this.add3D(localMicroblockIndex, microblockStart);
            const srcMicroblockIndex = this.linearIndex3D(localMicroblockIndex, microblockCropExtent);
            const dstMicroblockIndex = this.linearIndex3D(globalMicroblockIndex, microblockFullExtent);
            for (let i = 0; i < microblockSize; i++) {
                dstBytes[i + dstMicroblockIndex * microblockSize] = srcBytes[i + srcMicroblockIndex * microblockSize];
            }
        }
        return this;
    }

}
