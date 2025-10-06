export function formatToTextureType(gl, format) {
    switch (format) {
        case 'r8unorm': return { format: gl.RED, iformat: gl.R8, type: gl.UNSIGNED_BYTE };
        case 'rg8unorm': return { format: gl.RG, iformat: gl.RG8, type: gl.UNSIGNED_BYTE };
        case 'rgba8unorm': return { format: gl.RGBA, iformat: gl.RGBA8, type: gl.UNSIGNED_BYTE };
        case 'r16float': return { format: gl.RED, iformat: gl.R16F, type: gl.FLOAT };
        case 'rg16float': return { format: gl.RG, iformat: gl.RG16F, type: gl.FLOAT };
        case 'rgba16float': return { format: gl.RGBA, iformat: gl.RGBA16F, type: gl.FLOAT };
        case 'r32float': return { format: gl.RED, iformat: gl.R32F, type: gl.FLOAT };
        case 'rg32float': return { format: gl.RG, iformat: gl.RG32F, type: gl.FLOAT };
        case 'rgba32float': return { format: gl.RGBA, iformat: gl.RGBA32F, type: gl.FLOAT };
        default: throw new Error(`Unsupported format: '${format}'`);
    }
}
