import { Volume } from '../Volume.js';

export async function loadRAW(file, gl, size, datatype) {
    const volume = new Volume(gl, { size, datatype });

    let bytesPerVoxel;
    switch (datatype) {
        case 'unorm8': bytesPerVoxel = 1; break;
        case 'unorm16': bytesPerVoxel = 2; break;
        default: throw new Error(`loadRAW: datatype '${datatype}' not supported`);
    }
    const [width, height, depth] = size;
    const bytesPerSlice = width * height * bytesPerVoxel;
    for (let z = 0; z < depth; z++) {
        const data = await file.slice(z * bytesPerSlice, (z + 1) * bytesPerSlice).arrayBuffer();
        const origin = [0, 0, z];
        const extent = [width, height, 1];
        volume.writeData(data, origin, extent);
    }

    return volume;
}
