import { Volume } from '../Volume.js';

export async function loadRAW(file, gl, size, datatype) {
    let bytesPerVoxel;
    switch (datatype) {
        case 'unorm8': bytesPerVoxel = 1; break;
        case 'unorm16': bytesPerVoxel = 2; console.warn('Converting to 8-bit'); break;
        default: throw new Error(`loadRAW: datatype '${datatype}' not supported`);
    }
    const volume = new Volume(gl, { size, datatype: 'unorm8' });
    const [width, height, depth] = size;
    const bytesPerSlice = width * height * bytesPerVoxel;
    for (let z = 0; z < depth; z++) {
        let data = await file.slice(z * bytesPerSlice, (z + 1) * bytesPerSlice).arrayBuffer();
        if (bytesPerVoxel === 2) {
            const datau8 = new Uint8Array(data);
            const newlength = datau8.length / 2;
            const newdata = new ArrayBuffer(newlength);
            const newdatau8 = new Uint8Array(newdata);
            for (let i = 0; i < newlength; i++) {
                newdatau8[i] = datau8[2 * i + 1];
            }
            data = newdata;
        }
        const origin = [0, 0, z];
        const extent = [width, height, 1];
        volume.writeData(data, origin, extent);
    }

    return volume;
}
