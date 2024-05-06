export function tsort(graph) {
    const sorted = [];
    const visited = new Set();
    const processing = new Set();

    [...graph.keys()].forEach(function visit(node) {
        if (visited.has(node)) return;
        if (processing.has(node)) throw new Error('Cycle found');

        processing.add(node);
        graph.get(node).forEach(neighbor => visit(neighbor));
        processing.delete(node);

        sorted.push(node);
        visited.add(node);
    });

    return sorted;
}
