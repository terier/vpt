// #package js/main

const Ticker = (() => {

let queue = [];

(function tick() {
    queue.forEach(f => f());
    requestAnimationFrame(tick);
})();

function add(f) {
    if (!queue.includes(f)) {
        queue.push(f);
    }
}

function remove(f) {
    const idx = queue.indexOf(f);
    if (idx >= 0) {
        queue.splice(idx, 1);
    }
}

return { add, remove };

})();
