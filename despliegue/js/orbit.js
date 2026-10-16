/* Three.js r169 + GSAP 3.12.5, served locally alongside this static site. */
const story = document.querySelector('#kraken-orbit');
const canvas = document.querySelector('#orbit-canvas');
const pulse = document.querySelector('#orbit-pulse');
const status = document.querySelector('#orbit-status');
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const motion = { progress: 0, journey: 0, energy: 0 };
let renderStatic = () => {};
const journeyTrigger = {
    trigger: '#modalidades', start: 'top bottom',
    endTrigger: '#contacto', end: 'center center', invalidateOnRefresh: true,
};

if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
        // The entry sequence establishes brand, story, then the invitation to play.
        gsap.from('#hero-content [data-reveal]', {
            y: 28, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', clearProps: 'all'
        });
        gsap.from('#manifiesto [data-reveal]', {
            y: 30, opacity: 0, duration: .8, stagger: .08, ease: 'power3.out', clearProps: 'all',
            scrollTrigger: { trigger: '.manifesto-layout', start: 'top 85%', once: true }
        });
        gsap.to(motion, {
            progress: 1, ease: 'none',
            scrollTrigger: {
                trigger: '#manifiesto', start: () => innerWidth < 768 ? 'top 40%' : 'top bottom', end: 'top top', scrub: .8,
                onUpdate: () => renderStatic(), invalidateOnRefresh: true
            }
        });
        gsap.to(motion, {
            journey: 1, ease: 'none',
            scrollTrigger: { ...journeyTrigger, scrub: .8, onUpdate: () => renderStatic() },
        });
    });
    media.add('(prefers-reduced-motion: reduce)', () => {
        ScrollTrigger.create({
            trigger: '#manifiesto', start: () => innerWidth < 768 ? 'top 40%' : 'top bottom', end: 'top top',
            onUpdate: self => { motion.progress = self.progress; renderStatic(); }
        });
        ScrollTrigger.create({
            ...journeyTrigger,
            onUpdate: self => { motion.journey = self.progress; renderStatic(); },
        });
    });
}

try {
    const THREE = await import('./vendor/three.module.js');
    const { createD10Data } = await import('./d10.js');
    const { sampleOrbitPath, orbitBackdropOpacity } = await import('./orbit-path.js');
    const brandStyles = getComputedStyle(document.documentElement);
    const brand = Object.fromEntries(['red', 'surface', 'ivory', 'muted'].map(name =>
        [name, brandStyles.getPropertyValue(`--kraken-${name}`).trim()]));
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 60);
    camera.position.z = 10;
    scene.add(new THREE.HemisphereLight(brand.ivory, brand.surface, 2.5));
    const key = new THREE.DirectionalLight(brand.ivory, 4);
    key.position.set(3, 5, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(brand.red, 5);
    rim.position.set(-4, -1, 2);
    scene.add(rim);

    const sculpture = new THREE.Group();
    scene.add(sculpture);
    const d10 = createD10Data();
    const vertices = d10.vertices.map(vertex => new THREE.Vector3(...vertex));
    const triangles = [];
    const faces = d10.faces.map(face => {
        const corners = face.indices.map(index => vertices[index]);
        const center = corners.reduce((sum, vertex) => sum.add(vertex), new THREE.Vector3()).divideScalar(4);
        const normal = corners[1].clone().sub(corners[0]).cross(corners[2].clone().sub(corners[0])).normalize();
        if (normal.dot(center) < 0) { corners.reverse(); normal.negate(); }
        for (const vertex of [corners[0], corners[1], corners[2], corners[0], corners[2], corners[3]]) {
            triangles.push(vertex.x, vertex.y, vertex.z);
        }
        const pole = vertices[face.indices[0]];
        return { center, normal, up: pole.clone().sub(center).normalize(), number: face.number };
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(triangles, 3));
    geometry.computeVertexNormals();
    const material = new THREE.MeshPhysicalMaterial({
        color: brand.red, metalness: .48, roughness: .3, flatShading: true,
        clearcoat: .8, clearcoatRoughness: .2
    });
    const die = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, material);
    die.add(mesh);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: brand.ivory, transparent: true, opacity: .55 }));
    edges.scale.setScalar(1.002);
    die.add(edges);
    sculpture.add(die);

    // One label per kite face, numbered 1–10; opposing faces sum to eleven.
    const labels = [];
    const paintLabel = (labelCanvas, number) => {
        const ctx = labelCanvas.getContext('2d');
        ctx.clearRect(0, 0, 128, 128);
        ctx.font = `600 66px ${brandStyles.getPropertyValue('--font-display').trim()}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = brand.ivory;
        ctx.fillText(String(number), 64, 65);
        if (number === 6 || number === 9) ctx.fillRect(49, 100, 30, 3);
    };
    for (const face of faces) {
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = labelCanvas.height = 128;
        // Underline 6 and 9 so they remain legible during rotation.
        paintLabel(labelCanvas, face.number);
        const texture = new THREE.CanvasTexture(labelCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        labels.push({ canvas: labelCanvas, number: face.number, texture });
        const label = new THREE.Mesh(new THREE.PlaneGeometry(.52, .52),
            new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }));
        label.position.copy(face.center).addScaledVector(face.normal, .008);
        const right = face.up.clone().cross(face.normal).normalize();
        label.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, face.up, face.normal));
        die.add(label);
    }
    const rings = new THREE.Group();
    rings.rotation.set(.85, .25, -.35);
    sculpture.add(rings);
    for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9 + i * .28, .006, 4, 128),
            new THREE.MeshBasicMaterial({ color: i === 1 ? brand.red : brand.muted, transparent: true, opacity: i === 1 ? .65 : .25 }));
        ring.rotation.x = i * .62;
        ring.rotation.y = i * .48;
        rings.add(ring);
    }
    const satellite = new THREE.Mesh(geometry.clone().scale(.11, .11, .11),
        new THREE.MeshStandardMaterial({ color: brand.ivory, metalness: .65, roughness: .28 }));
    rings.add(satellite);
    const particleCount = innerWidth < 768 ? 160 : 380;
    const coordinates = new Float32Array(particleCount * 3);
    for (let i = 0; i < coordinates.length; i++) coordinates[i] = (Math.random() - .5) * 22;
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(coordinates, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
        color: brand.muted, size: .016, transparent: true, opacity: .4, depthWrite: false
    }));
    scene.add(particles);

    const pointer = new THREE.Vector2();
    const heroAnchor = document.querySelector('#hero-dice-anchor');
    const manifestoAnchor = document.querySelector('#manifesto-dice-anchor');
    const finalAnchor = document.querySelector('#final-dice-anchor');
    const modalities = document.querySelector('#modalidades');
    const journeySections = ['modalidades', 'experiencias', 'sobre-mi', 'resenas', 'universo', 'como-funciona']
        .map(id => document.getElementById(id)).filter(Boolean);
    const sceneViewport = document.querySelector('.orbit-viewport');
    let journeyStops = [];
    let journeyStart = 0;
    let journeyEnd = 1;
    let landingDocumentY = 0;
    const measureJourney = () => {
        const scroll = window.scrollY;
        const manifesto = manifestoAnchor.getBoundingClientRect();
        const start = modalities.getBoundingClientRect().top + scroll - innerHeight;
        const landing = finalAnchor.getBoundingClientRect();
        landingDocumentY = landing.top + scroll;
        journeyStart = start;
        journeyEnd = landingDocumentY - innerHeight / 2;
        const mobile = innerWidth < 768;
        journeyStops = [{ scroll: start, x: manifesto.left, y: manifesto.top + scroll - start }];
        journeySections.forEach((section, index) => {
            const bounds = section.getBoundingClientRect();
            const position = bounds.top + scroll + bounds.height / 2 - innerHeight / 2;
            // Alternate across the page like the opening right-to-left movement.
            // On mobile keep the same path inside a narrower horizontal corridor.
            const x = (index % 2 === 0 ? (mobile ? .68 : .76) : (mobile ? .32 : .24)) * innerWidth;
            if (position > journeyStops[journeyStops.length - 1].scroll && position < journeyEnd) {
                journeyStops.push({ scroll: position, x, y: innerHeight * .5 });
            }
        });
        journeyStops.push({ scroll: journeyEnd, x: landing.left, y: innerHeight / 2 });
    };
    let elapsed = 0;
    let previous = 0;
    let visible = true;
    let contextLost = false;
    let energyTween;
    const reduced = () => motionPreference.matches;
    const draw = (milliseconds = previous) => {
        const delta = Math.min(Math.max((milliseconds - previous) / 1000, 0), .05);
        previous = milliseconds;
        if (!visible || document.hidden || contextLost) return;
        // Clip the single fixed WebGL surface to the complete story, through the CTA.
        const storyBounds = story.getBoundingClientRect();
        const clipTop = Math.max(0, storyBounds.top);
        const clipBottom = Math.max(0, innerHeight - storyBounds.bottom);
        sceneViewport.style.clipPath = `inset(${clipTop}px 0 ${clipBottom}px 0)`;
        if (!reduced()) elapsed += delta * (1 + motion.energy * 2.5);
        const hero = heroAnchor.getBoundingClientRect();
        const manifesto = manifestoAnchor.getBoundingClientRect();
        const t = motion.progress;
        const viewport = canvas.getBoundingClientRect();
        let x = THREE.MathUtils.lerp(hero.left, manifesto.left, t);
        let y = THREE.MathUtils.lerp(hero.top, manifesto.top, t);
        const inJourney = window.scrollY >= journeyStart;
        if (inJourney && journeyStops.length) {
            const progress = gsap && ScrollTrigger ? motion.journey
                : THREE.MathUtils.clamp((window.scrollY - journeyStart) / Math.max(1, journeyEnd - journeyStart), 0, 1);
            const position = journeyStart + progress * (journeyEnd - journeyStart);
            const point = sampleOrbitPath(journeyStops, position);
            x = point.x;
            y = point.y;
            if (progress >= 1) {
                // Once landed, remain anchored to the actual CTA center as it exits.
                x = finalAnchor.getBoundingClientRect().left;
                y = landingDocumentY - window.scrollY;
            }
            sceneViewport.style.opacity = String(orbitBackdropOpacity(progress));
        } else sceneViewport.style.opacity = '1';
        y -= viewport.top;
        const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
        sculpture.position.set((x / innerWidth - .5) * height * camera.aspect, (.5 - y / innerHeight) * height, 0);
        const scale = innerWidth < 768 ? Math.min(innerWidth / 640, .65) : Math.min(innerWidth / 1450, 1.12);
        sculpture.scale.setScalar(scale * (1 + motion.energy * .08));
        sculpture.rotation.set(.1 + pointer.y * .08, pointer.x * .1, 0);
        die.rotation.set(.2 + elapsed * .09, .35 + elapsed * .2 + (reduced() ? 0 : t * 1.8), .1 + elapsed * .05);
        rings.rotation.z = -.35 + elapsed * .055;
        satellite.position.set(Math.cos(elapsed * .45) * 2.18, Math.sin(elapsed * .45) * 2.18, 0);
        satellite.rotation.y = elapsed;
        particles.rotation.y = elapsed * .008;
        renderer.render(scene, camera);
    };
    renderStatic = () => { if (reduced()) draw(); };
    const resize = () => {
        renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1.25 : 1.75));
        renderer.setSize(innerWidth, innerHeight, false);
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        measureJourney();
        draw();
    };
    const updateLoop = () => {
        sceneViewport.style.visibility = visible ? 'visible' : 'hidden';
        renderer.setAnimationLoop(visible && !document.hidden && !reduced() && !contextLost ? draw : null);
        previous = performance.now();
        draw();
    };
    const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        updateLoop();
    });
    observer.observe(story);
    story.addEventListener('pointermove', event => {
        if (reduced() || event.pointerType === 'touch') return;
        pointer.set(event.clientX / innerWidth * 2 - 1, event.clientY / innerHeight * 2 - 1);
    }, { passive: true });
    story.addEventListener('pointerleave', () => pointer.set(0, 0));
    pulse.addEventListener('click', () => {
        if (contextLost) return;
        energyTween?.kill();
        if (reduced() || !gsap) {
            status.textContent = 'Tu próxima historia empieza con una decisión.';
            return;
        }
        status.textContent = 'Has cambiado el curso de la historia.';
        energyTween = gsap.timeline({ onComplete: () => { status.textContent = 'El destino espera.'; } })
            .to(motion, { energy: 1, duration: .25, ease: 'power2.out' })
            .to(motion, { energy: 0, duration: 1.8, ease: 'power3.out' });
    });
    canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault(); contextLost = true; updateLoop();
        story.classList.remove('orbit-ready'); pulse.disabled = true;
        status.textContent = 'El destino espera.';
    });
    canvas.addEventListener('webglcontextrestored', () => {
        contextLost = false; resize(); story.classList.add('orbit-ready'); pulse.disabled = false; updateLoop();
    });
    addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', updateLoop);
    motionPreference.addEventListener('change', updateLoop);
    // The stationary sculpture still follows document position without auto rotation.
    ScrollTrigger?.create({ trigger: story, start: 'top bottom', end: 'bottom top', onUpdate: renderStatic });
    ScrollTrigger?.addEventListener('refresh', measureJourney);
    resize();
    story.classList.add('orbit-ready'); pulse.disabled = false;
    updateLoop();
    document.fonts.load('600 66px Cinzel').then(() => {
        if (contextLost) return;
        labels.forEach(label => { paintLabel(label.canvas, label.number); label.texture.needsUpdate = true; });
        measureJourney();
        ScrollTrigger?.refresh();
        renderStatic();
    }).catch(() => {});
    addEventListener('pagehide', event => {
        if (event.persisted) return;
        observer.disconnect(); energyTween?.kill(); renderer.setAnimationLoop(null);
        ScrollTrigger?.removeEventListener('refresh', measureJourney);
        scene.traverse(object => {
            object.geometry?.dispose();
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach(item => { item?.map?.dispose(); item?.dispose(); });
        });
        renderer.dispose();
    }, { once: true });
} catch (error) {
    // The static numbered die and the complete page remain available without WebGL.
    pulse.disabled = true;
    story.classList.add('orbit-error');
    console.warn('La escena 3D no está disponible; se muestra la ilustración del D10.', error);
}
