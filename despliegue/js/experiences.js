/* GSAP entrance and interaction feedback for three direct adventure links. */
(() => {
    const section = document.querySelector('#experiencias');
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!section || !gsap || !ScrollTrigger) return;
    const cards = [...section.querySelectorAll('.adventure-card')];
    const gallery = section.querySelector('.adventure-gallery');
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let introFinished = true;
    const pose = index => innerWidth < 768 || preference.matches
        ? { y: 0, rotation: 0, rotateY: 0 }
        : { y: Math.abs(index - 1) * 14, rotation: (index - 1) * 2.2, rotateY: (index - 1) * -2 };
    const arrange = () => cards.forEach((card, index) => {
        gsap.killTweensOf(card);
        gsap.set(card, { ...pose(index), rotateX: 0, opacity: 1 });
    });
    cards.forEach((card, index) => {
        const lift = event => {
            if (!introFinished || preference.matches || innerWidth < 768 || event.pointerType === 'touch') return;
            gsap.to(card, { y: pose(index).y - 10, rotation: 0, rotateY: 0, duration: .35, ease: 'power3.out', overwrite: true });
        };
        const restore = () => {
            if (!introFinished || preference.matches || card.matches(':hover, :focus-within')) return;
            gsap.to(card, { ...pose(index), duration: .45, ease: 'power3.out', overwrite: true });
        };
        card.addEventListener('pointerenter', lift);
        card.addEventListener('pointerleave', restore);
        card.addEventListener('focusin', lift);
        card.addEventListener('focusout', () => queueMicrotask(restore));
    });
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        introFinished = false;
        gsap.fromTo(cards, { y: 110, rotation: index => (index - 1) * 12, rotateX: 12, opacity: 0 }, {
            y: index => pose(index).y, rotation: index => pose(index).rotation, rotateY: index => pose(index).rotateY,
            rotateX: 0, opacity: 1, duration: 1.1, stagger: .12, ease: 'power3.out',
            scrollTrigger: { trigger: gallery, start: 'top 85%', once: true },
            onComplete: () => { introFinished = true; }
        });
        cards.forEach(card => gsap.fromTo(card.querySelector('img'), { yPercent: -3 }, { yPercent: 3, ease: 'none',
            scrollTrigger: { trigger: gallery, start: 'top bottom', end: 'bottom top', scrub: .6 } }));
        return () => { introFinished = true; };
    });
    media.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(gallery, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .8, ease: 'power2.out',
            scrollTrigger: { trigger: gallery, start: 'top 90%', once: true } });
    });
    const resize = () => { introFinished = true; arrange(); };
    addEventListener('resize', resize, { passive: true });
    preference.addEventListener('change', arrange);
    addEventListener('pagehide', event => {
        if (event.persisted) return;
        media.revert(); removeEventListener('resize', resize);
    }, { once: true });
})();
