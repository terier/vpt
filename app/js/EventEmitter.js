var EventEmitter = {

    addEventListener: function(event, handler) {
        if (!this._eventHandlers) {
            this._eventHandlers = {};
        }
        if (!this._eventHandlers[event]) {
            this._eventHandlers[event] = [];
        }
        this._eventHandlers[event].push(handler);
    },

    removeEventListener: function(event, handler) {
        var handlers = this._eventHandlers[event];
        if (!handlers) {
            return;
        }

        for (var i = 0; i < handlers.length; i++) {
            if (handlers[i] === handler) {
                handlers.splice(i--, 1);
            }
        }
    },

    trigger: function(event) {
        var handlers = this._eventHandlers[event];
        if (!handlers) {
            return;
        }

        for (var i = 0; i < handlers.length; i++) {
            handlers[i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
    }

};
