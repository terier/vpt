// #package js/main

// #include AbstractLoader.js

class AjaxLoader extends AbstractLoader {

constructor(url) {
    super();

    this.url = url;
}

readLength(handlers) {
    let xhr = new XMLHttpRequest();
    xhr.addEventListener('load', e => {
        const contentLength = e.target.getResponseHeader('Content-Length');
        handlers.onData && handlers.onData(parseInt(contentLength, 10));
    });
    xhr.open('HEAD', this.url);
    xhr.responseType = 'arraybuffer';
    xhr.send();
}

readData(start, end, handlers) {
    let xhr = new XMLHttpRequest();
    xhr.addEventListener('load', e => {
        handlers.onData && handlers.onData(e.target.response);
    });
    xhr.open('GET', this.url);
    xhr.setRequestHeader('Range', 'bytes=' + start + '-' + (end - 1));
    xhr.responseType = 'arraybuffer';
    xhr.send();
}

}
