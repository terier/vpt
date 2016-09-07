function Volume(data, width, height, depth, bitdepth) {
    if (bitdepth === 8) {
        this.data = new Float32Array(new Uint8Array(data));
    } else if (bitdepth === 16) {
        this.data = new Float32Array(new Uint16Array(data));
    }
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.bitdepth = bitdepth;
}
