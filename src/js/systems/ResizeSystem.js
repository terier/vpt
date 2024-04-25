export class ResizeSystem {

    constructor({
        canvas,
        resize,
        resolutionFactor = 1,
        minWidth = 1,
        minHeight = 1,
        maxWidth = Infinity,
        maxHeight = Infinity,
    } = {}) {
        this._resize = this._resize.bind(this);

        this.canvas = canvas;
        this.resize = resize;

        this.resolutionFactor = resolutionFactor;
        this.minCanvasSize = {
            width: minWidth,
            height: minHeight,
        };
        this.maxCanvasSize = {
            width: maxWidth,
            height: maxHeight,
        };
        this.lastSize = {
            width: null,
            height: null,
        };
    }

    start() {
        if (this._resizeFrame) {
            return;
        }

        this._resizeFrame = requestAnimationFrame(this._resize);
    }

    stop() {
        if (!this._resizeFrame) {
            return;
        }

        this._resizeFrame = cancelAnimationFrame(this._resizeFrame);
    }

    _resize() {
        this._resizeFrame = requestAnimationFrame(this._resize);

        const displayRect = this.canvas.getBoundingClientRect();
        if (displayRect.width === this.lastSize.width && displayRect.height === this.lastSize.height) {
            return;
        }

        this.lastSize = {
            width: displayRect.width,
            height: displayRect.height,
        };

        const displaySize = {
            width: displayRect.width * devicePixelRatio,
            height: displayRect.height * devicePixelRatio,
        };

        const unclampedSize = {
            width: Math.round(displaySize.width * this.resolutionFactor),
            height: Math.round(displaySize.height * this.resolutionFactor),
        };

        const canvasSize = {
            width: Math.min(Math.max(unclampedSize.width, this.minCanvasSize.width), this.maxCanvasSize.width),
            height: Math.min(Math.max(unclampedSize.height, this.minCanvasSize.height), this.maxCanvasSize.height),
        };

        //if (this.canvas.width !== canvasSize.width || this.canvas.height !== canvasSize.height) {
        //    this.canvas.width = canvasSize.width;
        //    this.canvas.height = canvasSize.height;
        //}

        this.resize?.({ displaySize, canvasSize });
    }

}
