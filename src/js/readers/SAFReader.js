const SAF_SIGNATURE = [
    0xab, 0x53, 0x41, 0x46, 0x20, 0x31, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
];

const MANIFEST_SIZE_OFFSET = SAF_SIGNATURE.length;
const MANIFEST_OFFSET = SAF_SIGNATURE.length + 4;

export class SAFReader {

    constructor(file) {
        this.file = file;
        this.manifest = null;
    }

    async readFile(path) {
        if (!this.manifest) {
            await this.readManifest();
        }

        const entry = this.manifest.find(entry => entry.path === path);
        if (!entry) {
            throw new Error(`SAFReader: file ${fileName} not found`);
        }

        return entry.file;
    }

    async readManifest() {
        // check signature
        if (this.file.size < SAF_SIGNATURE.length) {
            throw new Error(`SAFReader: archive too short`);
        }

        const signatureBuffer = await this.file.slice(0, SAF_SIGNATURE.length).arrayBuffer();
        const signature = new Uint8Array(signatureBuffer);
        for (let i = 0; i < SAF_SIGNATURE.length; i++) {
            if (signature[i] !== SAF_SIGNATURE[i]) {
                throw new Error(`SAFReader: signature mismatch`);
            }
        }

        // read manifest size
        if (this.file.size < MANIFEST_OFFSET) {
            throw new Error(`SAFReader: archive too short`);
        }

        const manifestSizeBuffer = await this.file.slice(
            MANIFEST_SIZE_OFFSET, MANIFEST_OFFSET).arrayBuffer();
        const manifestSize = new DataView(manifestSizeBuffer).getUint32(0, true);

        // read manifest json
        const fileStartOffset = MANIFEST_OFFSET + manifestSize;
        if (this.file.size < fileStartOffset) {
            throw new Error(`SAFReader: manifest size too large`);
        }

        const manifestText = await this.file.slice(MANIFEST_OFFSET, fileStartOffset).text();
        try {
            this.manifest = JSON.parse(manifestText);
        } catch (e) {
            throw new Error(`SAFReader: cannot parse manifest`);
        }

        // check total file size
        const filesLength = this.manifest.reduce((acc, entry) => acc + entry.size, 0);
        if (this.file.size < fileStartOffset + filesLength) {
            throw new Error(`SAFReader: files too large`);
        }

        // slice the archive
        let offset = fileStartOffset;
        for (const entry of this.manifest) {
            entry.offset = offset;
            entry.file = this.file.slice(offset, offset + entry.size);
            offset += entry.size;
        }
    }

}
