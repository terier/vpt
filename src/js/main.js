// #package js/main

// #include Application.js
// #include ResourceLoader.js

const resources = {
    shaders: {
        type: 'json',
        url: 'glsl/shaders.json'
    },
    mixins: {
        type: 'json',
        url: 'glsl/mixins.json'
    },
    templates: {
        type: 'json',
        url: 'html/templates.json'
    },
    uispecs: {
        type: 'json',
        url: 'uispecs.json'
    },
    all: {
        type: 'dummy',
        dependencies: [
            'shaders',
            'mixins',
            'templates',
            'uispecs'
        ]
    }
};

// TODO: fix this quick hack to load all resources into the old globals
ResourceLoader.instance = new ResourceLoader(resources);

let SHADERS;
let MIXINS;
let TEMPLATES;
let UISPECS;

document.addEventListener('DOMContentLoaded', async () => {
    const rl = ResourceLoader.instance;
    const res = await rl.loadResource('all');
    SHADERS   = await rl.loadResource('shaders');
    MIXINS    = await rl.loadResource('mixins');
    TEMPLATES = await rl.loadResource('templates');
    UISPECS   = await rl.loadResource('uispecs');
    for (const name in UISPECS) {
        UISPECS[name] = JSON.parse(UISPECS[name]);
    }
    const application = new Application();
});
