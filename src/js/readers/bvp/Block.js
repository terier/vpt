import { vec } from './vec.js';

export class Block {

    constructor(dimensions, format, data = null) {
        this.dimensions = dimensions;
        this.format = format;

        this.data = data !== null ? data : format.allocateDimensions(dimensions);
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
        for (const localMicroblockIndex of vec.lexi(microblockCropExtent)) {
            const globalMicroblockIndex = vec.add(localMicroblockIndex, microblockStart);
            const srcMicroblockIndex = vec.linearIndex(globalMicroblockIndex, microblockFullExtent);
            const dstMicroblockIndex = vec.linearIndex(localMicroblockIndex, microblockCropExtent);
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
        for (const localMicroblockIndex of vec.lexi(microblockCropExtent)) {
            const globalMicroblockIndex = vec.add(localMicroblockIndex, microblockStart);
            const srcMicroblockIndex = vec.linearIndex(localMicroblockIndex, microblockCropExtent);
            const dstMicroblockIndex = vec.linearIndex(globalMicroblockIndex, microblockFullExtent);
            for (let i = 0; i < microblockSize; i++) {
                dstBytes[i + dstMicroblockIndex * microblockSize] = srcBytes[i + srcMicroblockIndex * microblockSize];
            }
        }
        return this;
    }

}
