// Scroll-space interpolation shared by the orbital scene and its geometry-free tests.
export function sampleOrbitPath(stops, scrollPosition) {
    if (!stops.length) return null;
    if (scrollPosition <= stops[0].scroll) return { x: stops[0].x, y: stops[0].y };
    const last = stops[stops.length - 1];
    if (scrollPosition >= last.scroll) return { x: last.x, y: last.y };
    for (let index = 1; index < stops.length; index++) {
        const end = stops[index];
        if (scrollPosition > end.scroll) continue;
        const start = stops[index - 1];
        const span = end.scroll - start.scroll;
        const t = span > 0 ? Math.min(1, Math.max(0, (scrollPosition - start.scroll) / span)) : 1;
        const eased = t * t * (3 - 2 * t);
        return { x: start.x + (end.x - start.x) * eased, y: start.y + (end.y - start.y) * eased };
    }
    return { x: last.x, y: last.y };
}

export function orbitBackdropOpacity(progress) {
    const smooth = value => {
        const t = Math.min(1, Math.max(0, value));
        return t * t * (3 - 2 * t);
    };
    // Preserve the opening at full strength, then recede behind commercial content.
    const background = 1 - .68 * smooth(progress / .08);
    return background + (.4 - background) * smooth((progress - .88) / .12);
}
