#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// -----------------------------------------------------------------------------
// ------------------------------- VOLUME UTILS --------------------------------
//
// node.exe .\raw2bvp.js -m default -i skull.raw -d 256x256x256 -f R8 -G true -m chan2 -i skull.raw -d 256x256x256 -f R8 -G true -o out.bvp

//  node.exe .\raw2bvp.js -m 1 -i ts_16_bin8_lp80A_inv_Background_u8bit.raw -d 512x720x224 -f R8 -G true -m 2 -i ts_16_bin8_lp80A_inv_Inner_u8bit.raw -d 512x720x224 -f R8 -G true -m 3 -i ts_16_bin8_lp80A_inv_Membrane_u8bit.raw -d 512x720x224 -f R8 -G true -m 4 -i ts_16_bin8_lp80A_inv_Spikes_u8bit.raw -d 512x720x224 -f R8 -G true  -o sai_ts_16_bin8.bvp
//
// -----------------------------------------------------------------------------

function totalCount(dim) {
    return dim.width * dim.height * dim.depth;
}

function index(idx, dims, offset) {
    offset = offset || {
        x: 0,
        y: 0,
        z: 0
    };
    return (idx.x + offset.x)
         + (idx.y + offset.y) * dims.width
         + (idx.z + offset.z) * dims.width * dims.height;
}

function extractBlock(volumeData, volumeDimensions, blockOffset, blockDimensions, bytesPerVoxel) {
    let blockData = Buffer.allocUnsafe(totalCount(blockDimensions) * bytesPerVoxel);
    for (let k = 0; k < blockDimensions.depth; k++) {
        for (let j = 0; j < blockDimensions.height; j++) {
            for (let i = 0; i < blockDimensions.width; i++) {
                let idx = {
                    x: i,
                    y: j,
                    z: k
                };
                let blockIndex = index(idx, blockDimensions);
                let volumeIndex = index(idx, volumeDimensions, blockOffset);
                for (let b = 0; b < bytesPerVoxel; b++) {
                    blockData[blockIndex * bytesPerVoxel + b] = volumeData[volumeIndex * bytesPerVoxel + b];
                }
            }
        }
    }
    return blockData;
}

function combineData(specs) {
    if (specs.length === 0) {
        return null;
    }

    let offset = 0;
    let stride = 0;
    for (let spec of specs) {
        spec.offset = offset;
        offset += spec.bytes;
        stride += spec.bytes;
        spec.count = spec.data.length / spec.bytes;
    }

    const count = specs[0].count;
    if (!specs.every(v => v.count === count)) {
        throw new Error('Cannot combine data');
    }

    let data = Buffer.allocUnsafe(count * stride);

    for (let i = 0; i < count; i++) {
        for (let spec of specs) {
            for (let b = 0; b < spec.bytes; b++) {
                data[i * stride + spec.offset + b] = spec.data[i * spec.bytes + b];
            }
        }
    }

    return data;
}

// -----------------------------------------------------------------------------
// --------------------------------- CRC UTILS ---------------------------------
// -----------------------------------------------------------------------------

function generateCrc32Table() {
    let table = new Int32Array(256);
    for (let i = 0; i < table.length; i++) {
        let n = i;
        for (let j = 0; j < 8; j++) {
            if (n & 1) {
                n = (n >>> 1) ^ 0xedb88320;
            } else {
                n >>>= 1;
            }
        }
        table[i] = n;
    }
    return table;
}

const CRC32_TABLE = generateCrc32Table();

function crc32(data) {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
        crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return ~crc;
}

// -----------------------------------------------------------------------------
// --------------------------------- ZIP UTILS ---------------------------------
// -----------------------------------------------------------------------------

class SerialBuffer {

    static get START_SIZE() {
        return 128;
    }

    constructor(buffer) {
        this.position = 0;
        this.bigEndian = false;

        if (buffer) {
            this.buffer = buffer;
            this.size = this.buffer.length;
        } else {
            this.size = SerialBuffer.START_SIZE;
            this.buffer = Buffer.allocUnsafe(this.size);
        }
    }

    resizeIfNeeded(toAdd) {
        let newSize = this.size;
        while (this.position + toAdd > newSize) {
            newSize = newSize * 2;
        }
        if (newSize > this.size) {
            let newBuffer = Buffer.allocUnsafe(newSize);
            this.buffer.copy(newBuffer);
            this.buffer = newBuffer;
            this.size = newSize;
        }
    }

    readByte() {
        let byte = this.buffer.readUInt8(this.position);
        this.position += 1;
        return byte;
    }

    readShort() {
        let short = this.bigEndian
            ? this.buffer.readUInt16BE(this.position)
            : this.buffer.readUInt16LE(this.position);
        this.position += 2;
        return short;
    }

    readInt() {
        let int = this.bigEndian
            ? this.buffer.readUInt32BE(this.position)
            : this.buffer.readUInt32LE(this.position);
        this.position += 4;
        return int;
    }

    writeByte(byte) {
        this.resizeIfNeeded(1);
        this.buffer.writeUInt8((byte >>> 0) & 0xff, this.position);
        this.position += 1;
    }

    writeShort(short) {
        this.resizeIfNeeded(2);
        if (this.bigEndian) {
            this.buffer.writeUInt16BE((short >>> 0) & 0xffff, this.position);
        } else {
            this.buffer.writeUInt16LE((short >>> 0) & 0xffff, this.position);
        }
        this.position += 2;
    }

    writeInt(int) {
        this.resizeIfNeeded(4);
        if (this.bigEndian) {
            this.buffer.writeUInt32BE(int >>> 0, this.position);
        } else {
            this.buffer.writeUInt32LE(int >>> 0, this.position);
        }
        this.position += 4;
    }

    writeBuffer(buffer) {
        this.resizeIfNeeded(buffer.length);
        buffer.copy(this.buffer, this.position);
        this.position += buffer.length;
    }

    getBuffer() {
        let slice = this.buffer.slice(0, this.position);
        return slice;
    }

}

function createLocalFileHeader(file) {
    let fileNameBuffer = Buffer.from(file.name);

    let buffer = new SerialBuffer();
    buffer.writeInt(0x04034b50);              // signature
    buffer.writeShort(20);                    // version needed to extract
    buffer.writeShort(0);                     // general purpose bit flag
    buffer.writeShort(0);                     // compression method
    buffer.writeShort(0);                     // last mod file time
    buffer.writeShort(0);                     // last mod file date
    buffer.writeInt(file.crc);                // crc32
    buffer.writeInt(file.data.length);        // compressed size
    buffer.writeInt(file.data.length);        // uncompressed size
    buffer.writeShort(fileNameBuffer.length); // file name length
    buffer.writeShort(0);                     // extra field length
    buffer.writeBuffer(fileNameBuffer);       // file name
    return buffer.getBuffer();
}

function createCentralDirectoryFileHeader(file) {
    let fileNameBuffer = Buffer.from(file.name);

    let buffer = new SerialBuffer();
    buffer.writeInt(0x02014b50);              // signature
    buffer.writeShort(0);                     // version made by
    buffer.writeShort(20);                    // version needed to extract
    buffer.writeShort(0);                     // general purpose bit flag
    buffer.writeShort(0);                     // compression method
    buffer.writeShort(0);                     // last mod file time
    buffer.writeShort(0);                     // last mod file date
    buffer.writeInt(file.crc);                // crc32
    buffer.writeInt(file.data.length);        // compressed size
    buffer.writeInt(file.data.length);        // uncompressed size
    buffer.writeShort(fileNameBuffer.length); // file name length
    buffer.writeShort(0);                     // extra field length
    buffer.writeShort(0);                     // file comment length
    buffer.writeShort(0);                     // disk number start
    buffer.writeShort(0);                     // internal file attributes
    buffer.writeInt(0);                       // external file attributes
    buffer.writeInt(file.offset);             // relative offset of local header
    buffer.writeBuffer(fileNameBuffer);       // file name
    return buffer.getBuffer();
}

function createEndOfCentralDirectoryRecord(numOfFiles, sizeOfCD, offsetOfCD) {
    let buffer = new SerialBuffer();
    buffer.writeInt(0x06054b50);              // signature
    buffer.writeShort(0);                     // number of this disk
    buffer.writeShort(0);                     // number of disk with start of CD
    buffer.writeShort(numOfFiles);            // number of CD entries on this disk
    buffer.writeShort(numOfFiles);            // total number of CD entries
    buffer.writeInt(sizeOfCD);                // size of CD without EOCD
    buffer.writeInt(offsetOfCD);              // offset of CD w.r.t. first disk
    buffer.writeShort(0);                     // zip file comment length
    return buffer.getBuffer();
}

function linearize(files, prefix = '') {
    let processed = [];
    files.forEach((file) => {
        let rawName = file.name;
        file.name = prefix + file.name;
        processed.push(file);
        if (file.type === 'directory') {
            file.data = Buffer.alloc(0);
            file.name += '/';
            processed = processed.concat(linearize(file.files, file.name));
        }
    });
    return processed;
}

function createZip(files, stream) {
    files = linearize(files);

    let offset = 0;
    files.forEach((file) => {
        console.error('Compressing ' + file.name);
        file.crc = crc32(file.data);
        file.offset = offset;
        let localFileHeader = createLocalFileHeader(file);
        stream.write(localFileHeader);
        stream.write(file.data);
        offset += localFileHeader.length + file.data.length;
    });

    let cdStart = offset;

    files.forEach((file) => {
        console.error('Writing CD header for ' + file.name);
        let cdFileHeader = createCentralDirectoryFileHeader(file);
        stream.write(cdFileHeader);
        offset += cdFileHeader.length;
    });

    let cdEnd = offset;
    let cdSize = cdEnd - cdStart;

    console.error('Writing EOCD');
    stream.write(createEndOfCentralDirectoryRecord(files.length, cdSize, cdStart));
}

// -----------------------------------------------------------------------------
// --------------------------------- GRADIENT ----------------------------------
// -----------------------------------------------------------------------------

function computeGradientSobel(volumeData, volumeDimensions, idx) {
    let kernelX = [
         1,  0, -1,
         2,  0, -2,
         1,  0, -1,

         2,  0, -2,
         4,  0, -4,
         2,  0, -2,

         1,  0, -1,
         2,  0, -2,
         1,  0, -1
    ];
    let kernelY = [
         1,  2,  1,
         0,  0,  0,
        -1, -2, -1,

         2,  4,  2,
         0,  0,  0,
        -2, -4, -2,

         1,  2,  1,
         0,  0,  0,
        -1, -2, -1
    ];
    let kernelZ = [
         1,  2,  1,
         2,  4,  2,
         1,  2,  1,

         0,  0,  0,
         0,  0,  0,
         0,  0,  0,

        -1, -2, -1,
        -2, -4, -2,
        -1, -2, -2
    ];
    let values = [
        0, 0, 0,
        0, 0, 0,
        0, 0, 0,

        0, 0, 0,
        0, 0, 0,
        0, 0, 0,

        0, 0, 0,
        0, 0, 0,
        0, 0, 0
    ];
    for (let k = 0; k < 3; k++) {
        for (let j = 0; j < 3; j++) {
            for (let i = 0; i < 3; i++) {
                let kernelIdx = index({
                    x : i,
                    y : j,
                    z : k
                }, {
                    width  : 3,
                    height : 3,
                    depth  : 3
                });
                let volumeIndex = index({
                    x : idx.x + i - 1,
                    y : idx.y + j - 1,
                    z : idx.z + k - 1
                }, volumeDimensions);
                values[kernelIdx] = volumeData[volumeIndex] / 255;
            }
        }
    }

    let dx = 0;
    for (let i = 0; i < kernelX.length; i++) {
        dx += kernelX[i] * values[i];
    }
    dx /= kernelX.length;

    let dy = 0;
    for (let i = 0; i < kernelY.length; i++) {
        dy += kernelY[i] * values[i];
    }
    dy /= kernelY.length;

    let dz = 0;
    for (let i = 0; i < kernelZ.length; i++) {
        dz += kernelZ[i] * values[i];
    }
    dz /= kernelZ.length;

    return { dx, dy, dz };
}

function computeGradientForward(volumeData, volumeDimensions, idx) {
    let valueCenter = volumeData[index(idx, volumeDimensions)] / 255;
    let valueX = volumeData[index({
        x : idx.x + 1,
        y : idx.y,
        z : idx.z
    }, volumeDimensions)] / 255;
    let valueY = volumeData[index({
        x : idx.x,
        y : idx.y + 1,
        z : idx.z
    }, volumeDimensions)] / 255;
    let valueZ = volumeData[index({
        x : idx.x,
        y : idx.y,
        z : idx.z + 1
    }, volumeDimensions)] / 255;

    let dx = valueX - valueCenter;
    let dy = valueY - valueCenter;
    let dz = valueZ - valueCenter;

    return { dx, dy, dz };
}

function computeGradient(volumeData, dimensions) {
    console.error('Computing gradient');

    const gradientData = Buffer.allocUnsafe(totalCount(dimensions) * 3);

    for (let k = 0; k < dimensions.depth; k++) {
        for (let j = 0; j < dimensions.height; j++) {
            for (let i = 0; i < dimensions.width; i++) {
                let centerIdx = index({
                    x: i,
                    y: j,
                    z: k
                }, dimensions);
                if (i === 0 || j === 0 || k === 0 ||
                    i === dimensions.width  - 1 ||
                    j === dimensions.height - 1 ||
                    k === dimensions.depth  - 1) {
                    gradientData[centerIdx] = 0;
                } else {
                    let gradient = computeGradientSobel(volumeData, dimensions, {
                        x: i,
                        y: j,
                        z: k
                    });

                    // here, dividing by Math.sqrt(3) would prevent clamping in the worst case
                    gradient.dx = Math.min(Math.max(Math.round(gradient.dx * 255), 0), 255);
                    gradient.dy = Math.min(Math.max(Math.round(gradient.dy * 255), 0), 255);
                    gradient.dz = Math.min(Math.max(Math.round(gradient.dz * 255), 0), 255);
                    gradientData[centerIdx * 3 + 0] = gradient.dx;
                    gradientData[centerIdx * 3 + 1] = gradient.dy;
                    gradientData[centerIdx * 3 + 2] = gradient.dz;
                }
            }
        }
    }

    console.error(gradientData[1408830]);
    return gradientData;
}

function computeGradientMagnitude(volumeData, dimensions) {
    console.error('Computing gradient magnitude');
    // let gms = new Set();

    const gradientData = Buffer.allocUnsafe(totalCount(dimensions));

    for (let k = 0; k < dimensions.depth; k++) {
        for (let j = 0; j < dimensions.height; j++) {
            for (let i = 0; i < dimensions.width; i++) {
                let centerIdx = index({
                    x: i,
                    y: j,
                    z: k
                }, dimensions);
                if (i === 0 || j === 0 || k === 0 ||
                    i === dimensions.width  - 1 ||
                    j === dimensions.height - 1 ||
                    k === dimensions.depth  - 1) {
                    gradientData[centerIdx] = 0;
                } else {
                    const { dx, dy, dz } = computeGradientSobel(volumeData, dimensions, {
                        x: i,
                        y: j,
                        z: k
                    });
                    // here, dividing by Math.sqrt(3) would prevent clamping in the worst case
                    const gradient = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    const normalized = Math.min(Math.max(Math.round(gradient * 255), 0), 255);
                    gradientData[centerIdx] = normalized;
                    // gms.add(normalized);
                }
            }
        }
    }
    // console.log(gms.size);
    // console.log(gms);
    // fs.appendFileSync("gms.raw", Uint8Array.from(gradientData));
    return gradientData;
}

function computeOutputData(volumeData, modality) {
    if (!modality.gradient && !modality.gradientMagnitude) {
        return volumeData;
    }

    if (modality.gradient && !modality.gradientMagnitude) {
        if (modality.format !== formats.R8) {
            throw new Error('Gradient requires format R8');
        }

        modality.format = formats.RGBA8;
        const gradientData = computeGradient(volumeData, modality.dimensions);
        return combineData([
            { data: volumeData,   bytes: 1 },
            { data: gradientData, bytes: 3 },
        ]);
    }

    if (!modality.gradient && modality.gradientMagnitude) {
        if (modality.format !== formats.R8) {
            throw new Error('Gradient magnitude requires format R8');
        }

        modality.format = formats.RG8;
        const gradientData = computeGradientMagnitude(volumeData, modality.dimensions);
        return combineData([
            { data: volumeData,   bytes: 1 },
            { data: gradientData, bytes: 1 },
        ]);
    }

    throw new Error('Cannot use both gradient and gradient magnitude');
}

// -----------------------------------------------------------------------------
// ---------------------------------- FORMAT -----------------------------------
// -----------------------------------------------------------------------------

const gl = {
    BYTE                           : 0x1400,
    UNSIGNED_BYTE                  : 0x1401,
    SHORT                          : 0x1402,
    UNSIGNED_SHORT                 : 0x1403,
    INT                            : 0x1404,
    UNSIGNED_INT                   : 0x1405,
    FLOAT                          : 0x1406,
    HALF_FLOAT                     : 0x140B,

    RED                            : 0x1903,
    RG                             : 0x8227,
    RGB                            : 0x1907,
    RGBA                           : 0x1908,
    RED_INTEGER                    : 0x8D94,
    RG_INTEGER                     : 0x8228,
    RGB_INTEGER                    : 0x8D98,
    RGBA_INTEGER                   : 0x8D99,

    RGB8                           : 0x8051,
    RGBA8                          : 0x8058,
    SRGB                           : 0x8C40,
    SRGB8                          : 0x8C41,
    RGBA32F                        : 0x8814,
    RGB32F                         : 0x8815,
    RGBA16F                        : 0x881A,
    RGB16F                         : 0x881B,
    RGB9_E5                        : 0x8C3D,
    RGBA32UI                       : 0x8D70,
    RGB32UI                        : 0x8D71,
    RGBA16UI                       : 0x8D76,
    RGB16UI                        : 0x8D77,
    RGBA8UI                        : 0x8D7C,
    RGB8UI                         : 0x8D7D,
    RGBA32I                        : 0x8D82,
    RGB32I                         : 0x8D83,
    RGBA16I                        : 0x8D88,
    RGB16I                         : 0x8D89,
    RGBA8I                         : 0x8D8E,
    RGB8I                          : 0x8D8F,
    R8                             : 0x8229,
    RG8                            : 0x822B,
    R16F                           : 0x822D,
    R32F                           : 0x822E,
    RG16F                          : 0x822F,
    RG32F                          : 0x8230,
    R8I                            : 0x8231,
    R8UI                           : 0x8232,
    R16I                           : 0x8233,
    R16UI                          : 0x8234,
    R32I                           : 0x8235,
    R32UI                          : 0x8236,
    RG8I                           : 0x8237,
    RG8UI                          : 0x8238,
    RG16I                          : 0x8239,
    RG16UI                         : 0x823A,
    RG32I                          : 0x823B,
    RG32UI                         : 0x823C,
    R8_SNORM                       : 0x8F94,
    RG8_SNORM                      : 0x8F95,
    RGB8_SNORM                     : 0x8F96,
    RGBA8_SNORM                    : 0x8F97,
};

const formats = {
    R8: {
        format: gl.RED,
        internalFormat: gl.R8,
        type: gl.UNSIGNED_BYTE,
        bytesPerVoxel: 1,
        bytesPerComponent: 1,
    },
    RG8: {
        format: gl.RG,
        internalFormat: gl.RG8,
        type: gl.UNSIGNED_BYTE,
        bytesPerVoxel: 2,
        bytesPerComponent: 1,
    },
    RGBA8: {
        format: gl.RGBA,
        internalFormat: gl.RGBA8,
        type: gl.UNSIGNED_BYTE,
        bytesPerVoxel: 4,
        bytesPerComponent: 1,
    },
    R32UI: {
        format: gl.RED_INTEGER,
        internalFormat: gl.R32UI,
        type: gl.UNSIGNED_INT,
        bytesPerVoxel: 4,
        bytesPerComponent: 4,
    }
};

// -----------------------------------------------------------------------------
// ----------------------------------- MAIN ------------------------------------
// -----------------------------------------------------------------------------

let manifest = {
    meta: {
        name    : 'Volume',
        comment : 'Volume generated with raw2bvp',
        version : 1
    },
    modalities: [],
    blocks: []
};

const modalityTemplate = {
    name: 'default',
    file: '',
    dimensions: {
        width  : 0,
        height : 0,
        depth  : 0
    },
    blockSize: 128,
    format: formats.R8,
    gradient: false,
    gradientMagnitude: false,
    transform: {
        matrix: [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]
    },
    placements: []
};

let manifestOutputFile = {
    type: 'file',
    name: 'manifest.json',
    data: null // update with manifest when finished
};

let blockOutputDirectory = {
    type: 'directory',
    name: 'blocks',
    files: []
};

let additionalFilesDirectory = {
    type: 'directory',
    name: 'files',
    files: []
};

let currentModality = null;
let outputFile = null;

for (let i = 2; i < process.argv.length - 1; i++) {
    let arg = process.argv[i];
    let val = process.argv[i + 1];
    switch (arg) {
        case '-m':
        case '--modality':
            currentModality = manifest.modalities.find(m => m.name === val);
            if (!currentModality) {
                currentModality = clone(modalityTemplate);
                currentModality.name = val;
                manifest.modalities.push(currentModality);
            }
            break;

        case '-i':
        case '--input-file':
            currentModality.file = val;
            break;

        case '-d':
        case '--dimensions':
            let split = val.split('x');
            currentModality.dimensions = {
                width  : parseInt(split[0]),
                height : parseInt(split[1]),
                depth  : parseInt(split[2]),
            };
            break;

        case '-b':
        case '--block-size':
            currentModality.blockSize = parseInt(val);
            break;

        case '-f':
        case '--format':
            currentModality.format = formats[val];

        case '-g':
        case '--gradient':
            currentModality.gradient = (val === 'true');
            break;

        case '-G':
        case '--gradient-magnitude':
            currentModality.gradientMagnitude = (val === 'true');
            break;

        case '--volume-name':
            manifest.meta.name = val;
            break;

        case '--volume-comment':
            manifest.meta.comment = val;
            break;

        case '-o':
        case '--output-file':
            outputFile = val;
            break;

        case '-a':
        case '--additional-file':
            additionalFilesDirectory.files.push({
                type: 'file',
                name: path.basename(val),
                data: fs.readFileSync(val)
            });
            break;
    }
}

let processedBlocks = 0;

for (const modality of manifest.modalities) {
    console.error(`Processing modality ${modality.name}`);
    const inputData = fs.readFileSync(modality.file);
    const volumeData = computeOutputData(inputData, modality);

    const { format, blockSize, dimensions } = modality;
    modality.format = format.format;
    modality.internalFormat = format.internalFormat;
    modality.type = format.type;

    const numberOfBlocks = {
        width  : Math.ceil(dimensions.width  / blockSize),
        height : Math.ceil(dimensions.height / blockSize),
        depth  : Math.ceil(dimensions.depth  / blockSize),
    };

    const totalBlocks = totalCount(numberOfBlocks);

    const blockDirectory = {
        type: 'directory',
        name: modality.name,
        files: []
    };

    for (let k = 0; k < numberOfBlocks.depth; k++) {
        for (let j = 0; j < numberOfBlocks.height; j++) {
            for (let i = 0; i < numberOfBlocks.width; i++) {
                const idx = {
                    x: i,
                    y: j,
                    z: k,
                };

                const internalIndex = index(idx, numberOfBlocks);
                const overallIndex = processedBlocks + internalIndex;
                const placement = {
                    index: overallIndex,
                    position: {
                        x: idx.x * blockSize,
                        y: idx.y * blockSize,
                        z: idx.z * blockSize,
                    }
                };

                const blockName = `block-${internalIndex}.raw`;
                const block = {
                    url: `blocks/${modality.name}/${blockName}`,
                    format: 'raw',
                    dimensions: {
                        width  : Math.min(dimensions.width  - placement.position.x, blockSize),
                        height : Math.min(dimensions.height - placement.position.y, blockSize),
                        depth  : Math.min(dimensions.depth  - placement.position.z, blockSize),
                    }
                };

                console.error(`Extracting block ${placement.index} of ${totalBlocks}`);
                const blockData = extractBlock(
                    volumeData, dimensions, placement.position,
                    block.dimensions, format.bytesPerVoxel);

                manifest.blocks.push(block);
                modality.placements.push(placement);

                blockDirectory.files.push({
                    type: 'file',
                    name: blockName,
                    data: blockData,
                });
            }
        }
    }

    // clean up manifest
    delete modality.file;
    delete modality.blockSize;
    delete modality.gradient;
    delete modality.gradientMagnitude;

    blockOutputDirectory.files.push(blockDirectory);
    processedBlocks += totalBlocks;
}

manifestOutputFile.data = Buffer.from(JSON.stringify(manifest));
const stream = outputFile ? fs.createWriteStream(outputFile) : process.stdout;
const files = [
    manifestOutputFile,
    blockOutputDirectory,
].concat(additionalFilesDirectory.files);
createZip(files, stream);
console.error('Done!');