import { MIPRenderer } from './MIPRenderer.js';
import { ISORenderer } from './ISORenderer.js';
import { EAMRenderer } from './EAMRenderer.js';
import { EAM2Renderer } from './EAM2Renderer.js';
import { EAMMCRenderer } from './EAMMCRenderer.js';
import { LAORenderer } from './LAORenderer.js';
import { MCSRenderer } from './MCSRenderer.js';
import { MCMRenderer } from './MCMRenderer.js';
import { DOSRenderer } from './DOSRenderer.js';
import { DepthRenderer } from './DepthRenderer.js';
import { PositionRenderer } from './PositionRenderer.js';

export function RendererFactory(which) {
    switch (which) {
        case 'mip': return MIPRenderer;
        case 'iso': return ISORenderer;
        case 'eam': return EAMRenderer;
        case 'eam2': return EAM2Renderer;
        case 'eammc': return EAMMCRenderer;
        case 'lao': return LAORenderer;
        case 'mcs': return MCSRenderer;
        case 'mcm': return MCMRenderer;
        case 'dos': return DOSRenderer;
        case 'depth': return DepthRenderer;
        case 'position': return PositionRenderer;

        default: throw new Error('No suitable class');
    }
}
