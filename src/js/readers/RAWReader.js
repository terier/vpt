export class RAWReader {

    constructor(file, {
        width = 1,
        height = 1,
        depth = 1,
        bytes = 1,
    } = {}) {
        this.file = file;
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.bytes = bytes;

        this.checkLength();
    }

    async readVolume() {
        const length = this.width * this.height * this.depth * this.bytes;
        return this.file.slice(0, length);
    }

    checkLength() {
        const length = this.width * this.height * this.depth * this.bytes;
        if (this.file.size !== length) {
            throw new Error(`File length should be ${length}, but it is ${this.file.length}`);
        }
    }

}
