import { AbstractFormat } from './AbstractFormat.js';

export class MonoFormat extends AbstractFormat {

    constructor(count, size, type) {
        super();
        this.count = count;
        this.size = size;
        this.type = type;
    }

    get family() {
        return 'mono';
    }

    get microblockSize() {
        return this.count * this.size;
    }

    get microblockDimensions() {
        return [1, 1, 1];
    }

}
