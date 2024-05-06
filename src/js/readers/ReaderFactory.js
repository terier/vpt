import { RAWReader } from './RAWReader.js';
import { BVPReader } from './BVPReader.js';
import { ZIPReader } from './ZIPReader.js';
import { SAFReader } from './SAFReader.js';

export function ReaderFactory(which) {
    switch (which) {
        case 'bvp': return BVPReader;
        case 'raw': return RAWReader;
        case 'zip': return ZIPReader;
        case 'saf': return SAFReader;

        default: throw new Error('No suitable class');
    }
}
