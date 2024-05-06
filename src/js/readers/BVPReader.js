import { vec } from './bvp/vec.js';
import { tsort } from './bvp/tsort.js';
import { decompress } from './bvp/lz4s.js';
import { Modality } from './bvp/Modality.js';
import { Block } from './bvp/Block.js';
import { MonoFormat } from './bvp/formats/MonoFormat.js';

import { Volume } from '../Volume.js';

export class BVPReader {

    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.manifest = null;
    }

    async readManifest() {
        if (this.manifest) {
            return;
        }

        const file = await this.fileSystem.readFile('manifest.json');
        const manifestString = await file.text();
        this.manifest = JSON.parse(manifestString);

        // TODO: Check cycles

        // Check and infer formats
        const graph = new Map();
        for (const block of this.manifest.blocks) {
            const subblocks = (block.placements ?? [])
                .map(placement => this.manifest.blocks[placement.block]);
            graph.set(block, subblocks);
        }
        for (const block of tsort(graph)) {
            const placementFormats = [...new Set((block.placements ?? [])
                .map(placement => this.manifest.blocks[placement.block].format))];

            if (placementFormats.length > 1) {
                throw new Error('Placement/Placement format clash');
            }

            const [placementFormat] = placementFormats;
            const blockFormat = block.format;

            if (placementFormat !== undefined && blockFormat !== undefined) {
                if (placementFormat !== blockFormat) {
                    throw new Error('Block/Placement format clash');
                }
            } else if (placementFormat === undefined && blockFormat === undefined) {
                throw new Error('Missing format');
            } else if (blockFormat === undefined) {
                block.format = placementFormat;
            }
        }

        this.formats = this.manifest.formats.map(
            formatDescriptor => this.createFormat(formatDescriptor));
    }

    async readModality(index) {
        await this.readManifest();

        const modalityDescriptor = this.manifest.modalities[index];
        if (!modalityDescriptor) {
            throw new Error(`Modality index ${index} does not exist`);
        }

        const block = await this.readBlock(modalityDescriptor.block);
        return new Modality(block);
    }

    async readBlock(index) {
        await this.readManifest();

        const blockDescriptor = this.manifest.blocks[index];
        if (!blockDescriptor) {
            throw new Error(`Block index ${index} does not exist`);
        }

        // Create empty block
        const dimensions = blockDescriptor.dimensions;
        const format = this.formats[blockDescriptor.format];
        const block = new Block(dimensions, format);

        // Fill placements
        if (blockDescriptor.placements) {
            for (const placement of blockDescriptor.placements) {
                const subblock = await this.readBlock(placement.block);
                block.set(placement.position, subblock);
            }
        }

        // Apply data
        if (blockDescriptor.data) {
            const { data, encoding } = blockDescriptor;
            // TODO encoding
            //if (encoding !== 'raw') {
            //    throw new Error(`Only raw encoding supported`);
            //}
            // TODO lz4s
            if (!['raw', 'lz4'].includes(encoding)) {
                throw new Error(`Encoding ${encoding} not supported`);
            }

            const externalFile = await this.fileSystem.readFile(data);
            const externalData = new Uint8Array(await externalFile.arrayBuffer());

            const decodedData = new Uint8Array(block.data.length);
            if (encoding === 'raw') {
                decodedData.set(externalData);
                // TODO check length
            } else if (encoding === 'lz4s') {
                decompress(externalData, decodedData);
                // TODO check length
            }

            block.data = externalData;
        }

        return block;
    }

    async readFormat(index) {
        await this.readManifest();

        const formatDescriptor = this.manifest.formats[index];
        if (!formatDescriptor) {
            throw new Error(`Format index ${index} does not exist`);
        }

        return this.createFormat(formatDescriptor);
    }

    createFormat(formatDescriptor) {
        // TODO read family, construct proper format
        if (formatDescriptor.family !== 'mono') {
            throw new Error(`Format family must be mono`);
        }

        const { count, size, type } = formatDescriptor;
        return new MonoFormat(1, 1, 'u');
    }

}
