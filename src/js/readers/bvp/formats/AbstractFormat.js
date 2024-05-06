import { vec } from '../vec.js';

export class AbstractFormat {

    allocateMicroblocks(microblockCount) {
        if (microblockCount < 0) {
            throw new Error('Negative microblock count');
        }

        return new ArrayBuffer(this.microblockSize * microblockCount);
    }

    allocateBytes(bytes) {
        if (bytes < 0) {
            throw new Error('Negative bytes');
        }
        if (bytes % this.microblockSize !== 0) {
            throw new Error('Not an integer number of microblocks');
        }

        const microblockCount = bytes / this.microblockSize;
        return this.allocateMicroblocks(microblockCount);
    }

    allocateDimensions(dimensions) {
        if (vec.any(vec.lt(dimensions, vec.zeros(dimensions.length)))) {
            throw new Error('Negative dimensions');
        }
        if (vec.any(vec.mod(dimensions, this.microblockDimensions))) {
            throw new Error('Not an integer number of microblocks');
        }

        const microblockCountVec = vec.div(dimensions, this.microblockDimensions);
        const microblockCount = vec.mulElements(microblockCountVec);
        return this.allocateMicroblocks(microblockCount);
    }

    get family() {
        throw new Error('Not implemented');
    }

    get microblockSize() {
        throw new Error('Not implemented');
    }

    get microblockDimensions() {
        throw new Error('Not implemented');
    }
}
