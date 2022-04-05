import { AjaxLoader } from './AjaxLoader.js';
import { BlobLoader } from './BlobLoader.js';

export function LoaderFactory(which) {
    switch (which) {
        case 'ajax': return AjaxLoader;
        case 'blob': return BlobLoader;

        default: throw new Error('No suitable class');
    }
}
