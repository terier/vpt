import { BVPZIPReader } from './BVPZIPReader.js';
import { BVPSAFReader } from './BVPSAFReader.js';
import { RAWReader } from './RAWReader.js';
import { ZIPReader } from './ZIPReader.js';
import { SAFReader } from './SAFReader.js';

export function ReaderFactory(which) {
    switch (which) {
        case 'bvpzip': return BVPZIPReader;
        case 'bvpsaf': return BVPSAFReader;
        case 'raw': return RAWReader;
        case 'zip': return ZIPReader;
        case 'saf': return SAFReader;

        default: throw new Error('No suitable class');
    }
}
