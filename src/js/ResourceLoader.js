//#package js/main

class ResourceLoader {

constructor(resources) {
    this.resources = resources;
    for (const name in this.resources) {
        this.resources[name].dependencies = this.resources[name].dependencies || [];
    }

    let graph = {};
    for (const name in this.resources) {
        graph[name] = this.resources[name].dependencies;
    }
    this.sorted = this.toposort(graph);
}

toposort(graph) {
    let sorted = [];
    let visited = {};
    let processing = {};

    Object.keys(graph).forEach(function visit(next) {
        if (visited[next]) return;
        if (processing[next]) throw new Error('Cyclic dependencies');

        processing[next] = true;
        graph[next].forEach(d => visit(d));
        processing[next] = false;

        visited[next] = true;
        sorted.push(next);
    });

    return sorted;
}

// resolve dependencies, load, then execute in correct sequence
get(name) {
    if (!(name in this.resources)) {
        return Promise.reject(name);
    }

    // construct dependency chain
    let dependencies = [name];
    let queue = [name];
    while (queue.length > 0) {
        const next = queue.pop();
        const deps = this.resources[next].dependencies.filter(name => !dependencies.includes(name));
        dependencies = dependencies.concat(deps);
        queue = queue.concat(deps);
    }

    // ensure correct sequence
    dependencies = this.sorted.filter(name => dependencies.includes(name));

    // load resources
    const promises = dependencies.map(name => this.loadResource(name));

    return Promise.all(promises).then(data => {
        // execute scripts and styles
        dependencies.forEach(name => {
            const dependency = this.resources[name];
            if (dependency.type === 'script') {
                dependency.promise.then(script => document.head.appendChild(script));
            } else if (dependency.type === 'style') {
                dependency.promise.then(style => document.head.appendChild(style));
            }
        });

        // return last one (the requested one, "name")
        return data.pop();
    });
}

get loaders() {
    return {
        'image'  : this.loadImage,
        'script' : this.loadScript,
        'style'  : this.loadStyle,
        'json'   : this.loadJson,
        'html'   : this.loadHtml
    };
}

// load single resource and save a promise
loadResource(name) {
    if (!(name in this.resources)) {
        return Promise.reject(name);
    }

    const resource = this.resources[name];
    if (resource.promise) {
        return resource.promise;
    }

    if (!(resource.type in this.loaders)) {
        return Promise.resolve(name);
    }

    const loader = this.loaders[resource.type];
    resource.promise = loader(resource.url);
    return resource.promise;
}

loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', reject);
        image.src = url;
    });
}

loadScript(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', () => {
            const script = document.createElement('script');
            script.text = xhr.response;
            resolve(script);
        });
        xhr.addEventListener('error', reject);
        xhr.open('GET', url);
        xhr.send();
    });
}

loadStyle(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', () => {
            const style = document.createElement('style');
            style.textContent = xhr.response;
            resolve(style);
        });
        xhr.addEventListener('error', reject);
        xhr.open('GET', url);
        xhr.send();
    });
}

loadJson(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.addEventListener('load', () => resolve(xhr.response));
        xhr.addEventListener('error', reject);
        xhr.open('GET', url);
        xhr.send();
    });
}

loadHtml(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'document';
        xhr.addEventListener('load', () => resolve(xhr.response));
        xhr.addEventListener('error', reject);
        xhr.open('GET', url);
        xhr.send();
    });
}

}
