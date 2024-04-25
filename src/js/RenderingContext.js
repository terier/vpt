export class RenderingContext extends EventTarget {

async recordAnimation(options = {}) {
    const date = new Date();
    const timestamp = [
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
    ].join('_');

    if (options.type === 'images') {
        const parentDirectory = await showDirectoryPicker();
        const directory = await parentDirectory.getDirectoryHandle(timestamp, { create: true });
        this.recordAnimationToImageSequence({ directory, ...options });
    } else if (options.type === 'video') {
        const outputStream = await showSaveFilePicker({
            suggestedName: timestamp + '.mp4',
        }).then(file => file.createWritable());
        this.recordAnimationToVideo({ outputStream, ...options });
    } else {
        throw new Error(`animation output type (${options.type}) not supported`);
    }
}

async recordAnimationToImageSequence(options = {}) {
    const { directory, startTime, endTime, frameTime, fps } = options;
    const frames = Math.max(Math.ceil((endTime - startTime) * fps), 1);
    const timeStep = 1 / fps;

    function wait(millis) {
        return new Promise((resolve, reject) => setTimeout(resolve, millis));
    }

    const canvas = this.canvas;
    function getCanvasBlob() {
        return new Promise((resolve, reject) => {
            canvas.toBlob(blob => resolve(blob));
        });
    }

    this.stopRendering();

    for (let i = 0; i < frames; i++) {
        const t = startTime + i * timeStep;
        this.cameraAnimator.update(t);

        this.renderer.reset();
        this.startRendering();
        await wait(frameTime * 1000);
        this.stopRendering();

        const filename = `frame${String(i).padStart(4, '0')}.png`;
        const file = await directory.getFileHandle(filename, { create: true })
            .then(file => file.createWritable());
        const blob = await getCanvasBlob();
        file.write(blob);
        file.close();

        this.dispatchEvent(new CustomEvent('animationprogress', {
            detail: (i + 1) / frames
        }));
    }

    this.startRendering();
}

async recordAnimationToVideo(options = {}) {
    const { outputStream, startTime, endTime, frameTime, fps } = options;
    const frames = Math.max(Math.ceil((endTime - startTime) * fps), 1);
    const timeStep = 1 / fps;

    function wait(millis) {
        return new Promise((resolve, reject) => setTimeout(resolve, millis));
    }

    const canvasStream = this.canvas.captureStream(0);
    const videoStream = canvasStream.getVideoTracks()[0];
    const recorder = new MediaRecorder(canvasStream, {
        videoBitsPerSecond : 4 * 1024 * 1024,
    });
    recorder.addEventListener('dataavailable', e => {
        outputStream.write(e.data);
        outputStream.close();
    });

    this.stopRendering();
    recorder.start();

    for (let i = 0; i < frames; i++) {
        const t = startTime + i * timeStep;
        this.cameraAnimator.update(t);

        this.renderer.reset();
        this.startRendering();
        await wait(frameTime * 1000);
        this.stopRendering();

        videoStream.requestFrame();

        this.dispatchEvent(new CustomEvent('animationprogress', {
            detail: (i + 1) / frames
        }));
    }

    recorder.stop();
    this.startRendering();
}

}
