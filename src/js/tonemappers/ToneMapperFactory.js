import { ArtisticToneMapper } from './ArtisticToneMapper.js';
import { RangeToneMapper } from './RangeToneMapper.js';
import { ReinhardToneMapper } from './ReinhardToneMapper.js';
import { Reinhard2ToneMapper } from './Reinhard2ToneMapper.js';
import { Uncharted2ToneMapper } from './Uncharted2ToneMapper.js';
import { FilmicToneMapper } from './FilmicToneMapper.js';
import { UnrealToneMapper } from './UnrealToneMapper.js';
import { AcesToneMapper } from './AcesToneMapper.js';
import { LottesToneMapper } from './LottesToneMapper.js';
import { UchimuraToneMapper } from './UchimuraToneMapper.js';

export function ToneMapperFactory(which) {
    switch (which) {
        case 'artistic': return ArtisticToneMapper;
        case 'range': return RangeToneMapper;
        case 'reinhard': return ReinhardToneMapper;
        case 'reinhard2': return Reinhard2ToneMapper;
        case 'uncharted2': return Uncharted2ToneMapper;
        case 'filmic': return FilmicToneMapper;
        case 'unreal': return UnrealToneMapper;
        case 'aces': return AcesToneMapper;
        case 'lottes': return LottesToneMapper;
        case 'uchimura': return UchimuraToneMapper;

        default: throw new Error('No suitable class');
    }
}
