// Pentagonal trapezohedron: twelve vertices and ten planar kite faces.
// The alternating ring height keeps each four-corner face coplanar.
export function createD10Data(radius = 1.28, height = 1.12) {
    const cosine = Math.cos(Math.PI / 5);
    const ringHeight = height * (1 - cosine) / (1 + cosine);
    const vertices = [[0, height, 0], [0, -height, 0]];
    for (let i = 0; i < 10; i++) {
        const angle = i * Math.PI / 5;
        vertices.push([radius * Math.cos(angle), i % 2 === 0 ? ringHeight : -ringHeight, radius * Math.sin(angle)]);
    }
    const ring = i => 2 + i % 10;
    const faces = [];
    for (let i = 0; i < 5; i++) {
        faces.push({ indices: [0, ring(i * 2), ring(i * 2 + 1), ring(i * 2 + 2)], number: i + 1 });
    }
    for (let i = 0; i < 5; i++) {
        faces.push({ indices: [1, ring(i * 2 + 1), ring(i * 2 + 2), ring(i * 2 + 3)], number: 10 - (i + 3) % 5 });
    }
    return { vertices, faces };
}
