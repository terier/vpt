import { AbstractLoader } from './AbstractLoader.js';

export class AjaxLoader extends AbstractLoader {

constructor(url) {
    super();

    this.url = url;
}

async readLength() {
    const response = await fetch(this.url, {
        method: 'HEAD'
    });
    const length = response.headers.get('Content-Length');
    return Number(length);
}

async readData(start, end) {
    const response = await fetch(this.url, {
        headers: {
            'Range': `bytes=${start}-${end - 1}`,
        }
    });
    return await response.arrayBuffer();
}

}
