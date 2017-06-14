var Volume = (function() {
'use strict';

function Volume(data, width, height, depth, bitdepth) {
    if (bitdepth === 8) {
        this.data = new Float32Array(new Uint8Array(data)).map(function(x) { return x / (1 << 8); });
    } else if (bitdepth === 16) {
        this.data = new Float32Array(new Uint16Array(data)).map(function(x) { return x / (1 << 16); });
    }
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.bitdepth = bitdepth;
}

return Volume;

})();
