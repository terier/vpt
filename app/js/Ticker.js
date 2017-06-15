var Ticker = (function() {
'use strict';

var queue = [];

(function tick() {
    queue.forEach(function(f) {
        f();
    });
    requestAnimationFrame(tick);
})();

function add(f) {
    if (queue.indexOf(f) < 0) {
        queue.push(f);
    }
};

function remove(f) {
    var idx = queue.indexOf(f);
    if (idx >= 0) {
        queue.splice(idx, 1);
    }
};

function clear() {
    for (var i = queue.length; i > 0; i--) {
        queue.pop();
    }
}

return {
    add: add,
    remove: remove,
    clear: clear
};

})();
