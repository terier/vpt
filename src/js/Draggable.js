// #package js/main

class Draggable {

constructor(element, handle) {
    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);

    this._element = element;
    this._handle = handle;
    this._startX = 0;
    this._startY = 0;

    this._handle.addEventListener('mousedown', this._handleMouseDown);
}

_handleMouseDown(e) {
    this._startX = e.pageX;
    this._startY = e.pageY;

    document.addEventListener('mousemove', this._handleMouseMove);
    document.addEventListener('mouseup', this._handleMouseUp);
    this._handle.removeEventListener('mousedown', this._handleMouseDown);

    const event = new CustomEvent('draggablestart', {
        detail: {
            x: this._startX,
            y: this._startY
        }
    });
    this._element.dispatchEvent(event);
}

_handleMouseUp(e) {
    document.removeEventListener('mousemove', this._handleMouseMove);
    document.removeEventListener('mouseup', this._handleMouseUp);
    this._handle.addEventListener('mousedown', this._handleMouseDown);

    const event = new CustomEvent('draggableend', {
        detail: {
            x: this._startX,
            y: this._startY
        }
    });
    this._element.dispatchEvent(event);
}

_handleMouseMove(e) {
    const dx = e.pageX - this._startX;
    const dy = e.pageY - this._startY;
    const x = this._element.offsetLeft;
    const y = this._element.offsetTop;
    this._element.style.left = (x + dx) + 'px';
    this._element.style.top = (y + dy) + 'px';
    this._startX = e.pageX;
    this._startY = e.pageY;

    const event = new CustomEvent('draggable', {
        detail: {
            x: this._startX,
            y: this._startY
        }
    });
    this._element.dispatchEvent(event);
}

}
