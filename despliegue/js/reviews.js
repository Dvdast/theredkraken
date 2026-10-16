/* Review content is kept in assets/data/reviews.json. No reviews or ratings are invented. */
(() => {
    const section = document.querySelector('#resenas');
    if (!section) return;
    const viewport = section.querySelector('.reviews-viewport');
    const track = section.querySelector('.reviews-track');
    const previous = section.querySelector('#reviews-previous');
    const next = section.querySelector('#reviews-next');
    const play = section.querySelector('#reviews-play');
    const counter = section.querySelector('.reviews-counter');
    const note = section.querySelector('.reviews-note');
    const live = section.querySelector('.reviews-live');
    const timerBar = section.querySelector('.reviews-timer');
    const gsap = window.gsap;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const interval = 6500;
    let reviews = [], originals = [], padding = 0, current = 0, step = 0;
    let timer, animation, progressAnimation, observer, resizeObserver;
    let visible = false, hovered = false, focused = false, userPaused = false, busy = false;

    const verifiedSource = review => {
        if (review.verified !== true || !/^\d{4}-\d{2}-\d{2}$/.test(review.verifiedAt || '')) return null;
        try {
            const source = new URL(review.source);
            return source.protocol === 'https:' && ['mesasroleras.com', 'www.mesasroleras.com'].includes(source.hostname)
                && source.pathname === '/gm/the-redkraken' && !source.username && !source.password && !source.port
                && !source.search ? source.href : null;
        } catch { return null; }
    };

    const setPosition = value => {
        if (gsap) gsap.set(track, { x: value });
        else track.style.transform = `translateX(${value}px)`;
    };
    const stopTimer = () => {
        clearTimeout(timer); progressAnimation?.kill();
        if (gsap) gsap.set(timerBar, { scaleX: 0 });
    };
    const canPlay = () => reviews.length > 1 && visible && !hovered && !focused && !userPaused && !preference.matches && !document.hidden && !busy;
    const schedule = () => {
        stopTimer();
        play.disabled = preference.matches || reviews.length < 2;
        play.textContent = preference.matches ? 'MOVIMIENTO REDUCIDO' : userPaused ? 'REANUDAR' : 'PAUSAR';
        play.setAttribute('aria-pressed', String(userPaused));
        if (!canPlay()) return;
        if (gsap) progressAnimation = gsap.to(timerBar, { scaleX: 1, duration: interval / 1000, ease: 'none' });
        timer = setTimeout(() => move(1, false), interval);
    };
    const updateAccessibleCards = () => {
        const count = innerWidth < 768 ? 1 : 2;
        // At the loop boundary the second visible card is a clone. Its source
        // must be reachable, while the offscreen original must stay inert.
        [...track.children].forEach((card, index) => {
            const active = index >= padding + current && index < padding + current + count;
            if (!active && card.contains(document.activeElement)) viewport.focus({ preventScroll: true });
            card.setAttribute('aria-hidden', String(!active));
            card.inert = !active;
        });
        counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(reviews.length).padStart(2, '0')}`;
    };
    const measure = () => {
        animation?.kill(); busy = false;
        if (!originals.length) return;
        step = originals[0].getBoundingClientRect().width + 24;
        setPosition(-(padding + current) * step);
        updateAccessibleCards(); schedule();
    };
    const move = (direction, manual = true) => {
        if (busy || reviews.length < 2) return;
        stopTimer(); busy = true;
        const destination = current + direction;
        current = (destination + reviews.length) % reviews.length;
        if (track.contains(document.activeElement)) viewport.focus({ preventScroll: true });
        [...track.children].forEach(card => { card.inert = true; card.setAttribute('aria-hidden', 'true'); });
        const finish = () => {
            setPosition(-(padding + current) * step);
            updateAccessibleCards();
            busy = false;
            if (manual) live.textContent = `Rese\u00f1a ${current + 1} de ${reviews.length}.`;
            schedule();
        };
        if (gsap && !preference.matches) {
            animation = gsap.to(track, { x: -(padding + destination) * step, duration: .85, ease: 'power3.inOut', onComplete: finish });
        } else finish();
    };
    const createCard = (review, index, placeholder) => {
        const card = document.createElement('article');
        card.className = `review-card${placeholder ? ' is-placeholder' : ''}`;
        const top = document.createElement('div'); top.className = 'review-top';
        const number = document.createElement('span'); number.className = 'review-index';
        number.textContent = String(index + 1).padStart(2, '0'); top.append(number);
        if (placeholder) {
            const pending = document.createElement('span'); pending.className = 'review-pending';
            pending.textContent = 'Pendiente de cargar'; top.append(pending);
        } else if (Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5) {
            const rating = document.createElement('span'); rating.className = 'review-rating';
            rating.setAttribute('role', 'img');
            rating.setAttribute('aria-label', `${review.rating} de 5 estrellas`);
            rating.textContent = '\u2605'.repeat(review.rating) + '\u2606'.repeat(5 - review.rating); top.append(rating);
        }
        const quote = document.createElement('blockquote');
        quote.textContent = placeholder ? 'Esta rese\u00f1a aparecer\u00e1 aqu\u00ed cuando incorporemos su contenido.' : review.text.trim();
        card.append(top, quote);
        if (!placeholder && review.author?.trim()) {
            const author = document.createElement('p'); author.className = 'review-author'; author.textContent = review.author.trim(); card.append(author);
        }
        if (!placeholder && review.context?.trim()) {
            const context = document.createElement('p'); context.className = 'review-context'; context.textContent = review.context.trim(); card.append(context);
        }
        if (!placeholder) {
            const label = document.createElement('span'); label.className = 'review-pending';
            label.textContent = review.excerpt ? 'Extracto literal' : 'Reseña original'; top.append(label);
            const source = document.createElement('a'); source.className = 'review-source';
            source.href = verifiedSource(review);
            source.textContent = 'Leer reseña original en Mesas Roleras';
            source.setAttribute('aria-label', `Leer la reseña original de ${review.author.trim()} en Mesas Roleras`);
            card.append(source);
        }
        return card;
    };
    const clone = card => {
        const copy = card.cloneNode(true); copy.setAttribute('aria-hidden', 'true'); copy.inert = true; return copy;
    };
    const init = async () => {
        try {
            const response = await fetch('./assets/data/reviews.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error('Invalid reviews data');
            const entries = data.filter(entry => entry && typeof entry.text === 'string' && typeof entry.author === 'string' && (entry.context === undefined || typeof entry.context === 'string'));
            // Never publish a summary, draft or unsourced attribution as a quote.
            reviews = entries.filter(entry => entry.text.trim() && entry.author.trim() && verifiedSource(entry));
            if (!reviews.length) {
                counter.textContent = '0 / 0';
                note.textContent = 'No hay extractos verificados disponibles. Puedes leer las reseñas originales en Mesas Roleras.';
                return;
            }
            section.classList.toggle('reviews-single', reviews.length === 1);
            originals = reviews.map((review, index) => createCard(review, index, false));
            padding = reviews.length > 1 ? Math.min(2, reviews.length) : 0;
            const leadingClones = padding ? originals.slice(-padding).map(clone) : [];
            track.replaceChildren(...leadingClones, ...originals, ...originals.slice(0, padding).map(clone));
            note.textContent = 'Selección de extractos literales. Lee cada reseña completa en su fuente.';
            previous.disabled = next.disabled = reviews.length < 2;
            previous.addEventListener('click', () => move(-1)); next.addEventListener('click', () => move(1));
            play.addEventListener('click', () => { userPaused = !userPaused; schedule(); });
            viewport.addEventListener('mouseenter', () => { hovered = true; schedule(); });
            viewport.addEventListener('mouseleave', () => { hovered = false; schedule(); });
            section.addEventListener('focusin', () => { focused = true; schedule(); });
            section.addEventListener('focusout', () => { queueMicrotask(() => { focused = section.contains(document.activeElement); schedule(); }); });
            viewport.addEventListener('keydown', event => {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
            });
            let touchStart;
            viewport.addEventListener('pointerdown', event => {
                if (event.pointerType === 'touch' && !event.target.closest('a, button')) {
                    touchStart = event.clientX; hovered = true;
                    viewport.setPointerCapture(event.pointerId); schedule();
                }
            });
            viewport.addEventListener('pointerup', event => {
                if (event.pointerType !== 'touch' || touchStart === undefined) return;
                const difference = event.clientX - touchStart; touchStart = undefined; hovered = false;
                if (Math.abs(difference) > 45) move(difference < 0 ? 1 : -1); else schedule();
            });
            viewport.addEventListener('pointercancel', () => { touchStart = undefined; hovered = false; schedule(); });
            preference.addEventListener('change', measure);
            document.addEventListener('visibilitychange', schedule);
            if ('ResizeObserver' in window) {
                resizeObserver = new ResizeObserver(measure); resizeObserver.observe(viewport);
            } else addEventListener('resize', measure, { passive: true });
            if ('IntersectionObserver' in window) {
                observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, { threshold: .25 });
                observer.observe(viewport);
            } else visible = true;
            measure();
        } catch (error) {
            counter.textContent = '0 / 0';
            note.textContent = 'No se han podido cargar las rese\u00f1as. Prueba a recargar la p\u00e1gina.';
            console.warn('Reviews unavailable:', error);
        }
    };
    init();
    addEventListener('pagehide', event => {
        if (event.persisted) return;
        stopTimer(); animation?.kill(); observer?.disconnect(); resizeObserver?.disconnect();
        removeEventListener('resize', measure);
    }, { once: true });
})();
