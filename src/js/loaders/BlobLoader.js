// #package js/main

// #include AbstractLoader.js

class BlobLoader extends AbstractLoader {

constructor(blob) {
    super();

    this.blob = blob;
}

readLength(handlers) {
    handlers.onData && handlers.onData(this.blob.size);
}

readData(start, end, handlers) {
    const fileReader = new FileReader();
    fileReader.addEventListener('load', e => {
        handlers.onData && handlers.onData(e.target.result);
    });
    fileReader.readAsArrayBuffer(this.blob.slice(start, end));
}

}
