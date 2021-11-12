// #package js/main

// #include utils
// #include readers
// #include loaders
// #include dialogs
// #include dialogs/renderers
// #include dialogs/tonemappers
// #include ui
// #include RenderingContext.js

class Application {

constructor() {
    this._handleFileDrop = this._handleFileDrop.bind(this);
    this._handleRendererChange = this._handleRendererChange.bind(this);
    this._handleToneMapperChange = this._handleToneMapperChange.bind(this);
    this._handleVolumeLoad = this._handleVolumeLoad.bind(this);
    this._handleEnvmapLoad = this._handleEnvmapLoad.bind(this);
    this._handleLightsChange = this._handleLightsChange.bind(this);
    this._handleIsoLayersChange = this._handleIsoLayersChange.bind(this);

    this._renderingContext = new RenderingContext();
    this._canvas = this._renderingContext.getCanvas();
    this._canvas.className += 'renderer';
    document.body.appendChild(this._canvas);

    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this._renderingContext.resize(width, height);
    });
    CommonUtils.trigger('resize', window);

    document.body.addEventListener('dragover', e => e.preventDefault());
    document.body.addEventListener('drop', this._handleFileDrop);

    this._mainDialog = new MainDialog();
    if (!this._renderingContext.hasComputeCapabilities()) {
        this._mainDialog.disableMCC();
    }

    this._statusBar = new StatusBar();
    this._statusBar.appendTo(document.body);

    this._volumeLoadDialog = new VolumeLoadDialog();
    this._volumeLoadDialog.appendTo(this._mainDialog.getVolumeLoadContainer());
    this._volumeLoadDialog.addEventListener('load', this._handleVolumeLoad);

    this._envmapLoadDialog = new EnvmapLoadDialog();
    this._envmapLoadDialog.appendTo(this._mainDialog.getEnvmapLoadContainer());
    this._envmapLoadDialog.addEventListener('load', this._handleEnvmapLoad);

    this._renderingContextDialog = new RenderingContextDialog();
    this._renderingContextDialog.appendTo(
        this._mainDialog.getRenderingContextSettingsContainer());
    this._renderingContextDialog.addEventListener('resolution', options => {
        this._renderingContext.setResolution(options.resolution);
    });
    this._renderingContextDialog.addEventListener('transformation', options => {
        const s = options.scale;
        const t = options.translation;
        this._renderingContext.setScale(s.x, s.y, s.z);
        this._renderingContext.setTranslation(t.x, t.y, t.z);
    });
    this._renderingContextDialog.addEventListener('filter', options => {
        this._renderingContext.setFilter(options.filter);
    });

    this._lightsDialog = new LightsDialog();
    this._lightsDialog.appendTo(this._mainDialog.getLightsContainer());
    this._lightsDialog.addEventListener('change', this._handleLightsChange);
    this._lightsDialog._setInitialLights();

    this._isoLayersDialog = new IsoLayersDialog();
    this._isoLayersDialog.appendTo(this._mainDialog.getLightsContainer());
    this._isoLayersDialog.addEventListener('change', this._handleIsoLayersChange);
    this._isoLayersDialog._setInitialData();

    this._mainDialog.addEventListener('rendererchange', this._handleRendererChange);
    this._mainDialog.addEventListener('tonemapperchange', this._handleToneMapperChange);

    const lastRenderer = localStorage.getItem("vpt_renderer");
    if (lastRenderer) {
        this._mainDialog.setSelectedRenderer(lastRenderer);
        this._mainDialog.trigger('rendererchange', lastRenderer);
    } else {
        this._mainDialog.trigger('rendererchange', this._mainDialog.getSelectedRenderer());
    }

    this._mainDialog.trigger('tonemapperchange', this._mainDialog.getSelectedToneMapper());
}

_handleFileDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 0) {
        return;
    }
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.bvp')) {
        return;
    }
    this._handleVolumeLoad({
        type       : 'file',
        file       : file,
        filetype   : 'bvp',
        dimensions : { x: 0, y: 0, z: 0 }, // doesn't matter
        precision  : 8 // doesn't matter
    });
}

_handleRendererChange(which) {
    if (this._rendererDialog) {
        this._rendererDialog.destroy();
    }
    this._renderingContext.chooseRenderer(which);
    const renderer = this._renderingContext.getRenderer();
    const container = this._mainDialog.getRendererSettingsContainer();
    const dialogClass = this._getDialogForRenderer(which);
    this._rendererDialog = new dialogClass(renderer);
    this._rendererDialog.appendTo(container);
    localStorage.setItem("vpt_renderer", which);

    this._handleLightsDialog();
    this._handleIsoLayersDialog();
}

_handleLightsDialog() {
    if (this._rendererDialog && !this._rendererDialog._hasLights) {
        this._lightsDialog.hide();
        return;
    }
    this._lightsDialog.show();
    this._handleLightsChange();
}

_handleIsoLayersDialog() {
    if (this._rendererDialog && !this._rendererDialog._hasIsoLayers) {
        this._isoLayersDialog.hide();
        return;
    }
    this._isoLayersDialog.show();
    this._handleIsoLayersChange();
}

_handleLightsChange() {
    if (!this._rendererDialog || !this._rendererDialog._hasLights)
        return;

    const lights = this._lightsDialog.getGroups();
    this._rendererDialog._handleChangeLights(lights);
}

_handleIsoLayersChange() {
    if (!this._rendererDialog || !this._rendererDialog._hasIsoLayers)
        return;
    const isoLayers = this._isoLayersDialog.getGroups();
    this._rendererDialog._handleChangeIsoLayers(isoLayers);
}

_handleToneMapperChange(which) {
    if (this._toneMapperDialog) {
        this._toneMapperDialog.destroy();
    }
    this._renderingContext.chooseToneMapper(which);
    const toneMapper = this._renderingContext.getToneMapper();
    const container = this._mainDialog.getToneMapperSettingsContainer();
    const dialogClass = this._getDialogForToneMapper(which);
    this._toneMapperDialog = new dialogClass(toneMapper);
    this._toneMapperDialog.appendTo(container);
}

_handleVolumeLoad(options) {
    if (options.type === 'file') {
        const readerClass = this._getReaderForFileType(options.filetype);
        if (readerClass) {
            const loader = new BlobLoader(options.file);
            const reader = new readerClass(loader, {
                width  : options.dimensions.x,
                height : options.dimensions.y,
                depth  : options.dimensions.z,
                bits   : options.precision
            });
            this._renderingContext.stopRendering();
            this._renderingContext.setVolume(reader);
        }
    } else if (options.type === 'url') {
        const readerClass = this._getReaderForFileType(options.filetype);
        if (readerClass) {
            const loader = new AjaxLoader(options.url);
            const reader = new readerClass(loader);
            this._renderingContext.stopRendering();
            this._renderingContext.setVolume(reader);
        }
    }
}

_handleEnvmapLoad(options) {
    let image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => {
        this._renderingContext.setEnvironmentMap(image);
        this._renderingContext.getRenderer().reset();
    });

    if (options.type === 'file') {
        let reader = new FileReader();
        reader.addEventListener('load', () => {
            image.src = reader.result;
        });
        reader.readAsDataURL(options.file);
    } else if (options.type === 'url') {
        image.src = options.url;
    }
}

_getReaderForFileType(type) {
    switch (type) {
        case 'bvp'  : return BVPReader;
        case 'raw'  : return RAWReader;
        case 'zip'  : return ZIPReader;
    }
}

_getDialogForRenderer(renderer) {
    switch (renderer) {
        case 'mip' : return MIPRendererDialog;
        case 'iso' : return ISORendererDialog;
        case 'eam' : return EAMRendererDialog;
        case 'mcs' : return MCSRendererDialog;
        case 'mcm' : return MCMRendererDialog;
        case 'mcc' : return MCMRendererDialog; // yes, the same
        case 'fcd' : return FCDRendererDialog;
        case 'fcn' : return FCNRendererDialog;
        case 'rcd' : return RCDRendererDialog;
        case 'rcn' : return RCNRendererDialog;
        case 'mcd' : return MCDRendererDialog;
        case 'imc' : return IMCRendererDialog;
        case 'cim' : return CIMRendererDialog;
        default    : return MIPRendererDialog;
    }
}

_getDialogForToneMapper(toneMapper) {
    switch (toneMapper) {
        case 'range'    : return RangeToneMapperDialog;
        case 'reinhard' : return ReinhardToneMapperDialog;
        case 'artistic' : return ArtisticToneMapperDialog;
        case 'de_noise' : return SmartDeNoiseToneMapperDialog;
    }
}

getMVP() {
    const rc = this._renderingContext;
    const renderer = rc._renderer;
    if (renderer) {
        return Array.from(renderer._mvpInverseMatrix.m)
    }
}

setMVP(m) {
    const rc = this._renderingContext;
    const renderer = rc._renderer;
    if (renderer) {
        renderer.setMvpInverseMatrix(new Matrix(m));
        renderer.reset();
    }
}

}
