// #package js/main

class EventEmitter {

constructor() {
    this._eventHandlers = {};
}

addEventListener(event, handler) {
    if (!this._eventHandlers[event]) {
        this._eventHandlers[event] = [];
    }
    this._eventHandlers[event].push(handler);
}

removeEventListener(event, handler) {
    let handlers = this._eventHandlers[event];
    if (!handlers) {
        return;
    }

    for (let i = 0; i < handlers.length; i++) {
        if (handlers[i] === handler) {
            handlers.splice(i--, 1);
        }
    }
}

trigger(event) {
    let handlers = this._eventHandlers[event];
    if (!handlers) {
        return;
    }

    for (let i = 0; i < handlers.length; i++) {
        handlers[i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
}

}
