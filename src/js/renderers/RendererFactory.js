import { MIPRenderer } from './MIPRenderer.js';
import { ISORenderer } from './ISORenderer.js';
import { EAMRenderer } from './EAMRenderer.js';
import { MCSRenderer } from './MCSRenderer.js';
import { MCMRenderer } from './MCMRenderer.js';
import { DOSRenderer } from './DOSRenderer.js';
import { FLDRenderer } from './FLDRenderer.js';
import { FDORenderer } from './FDORenderer.js';
import { FDMRenderer } from './FDMRenderer.js';

export function RendererFactory(which) {
    switch (which) {
        case 'mip': return MIPRenderer;
        case 'iso': return ISORenderer;
        case 'eam': return EAMRenderer;
        case 'mcs': return MCSRenderer;
        case 'mcm': return MCMRenderer;
        case 'dos': return DOSRenderer;
        case 'fld': return FLDRenderer;
        case 'fdo': return FDORenderer;
        case 'fdm': return FDMRenderer;

        default: throw new Error('No suitable class');
    }
}
