'use strict';

/* ============================================================
   THE RED KRAKEN
   Main interactions
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    initHeader();
    initMobileMenu();
    initRevealAnimations();
    initMagneticElements();
    initLightCards();
    initParallax();
    initSmoothAnchors();

});


/* ============================================================
   HEADER
   Añade fondo + blur cuando hacemos scroll
============================================================ */

function initHeader() {

    const header = document.querySelector('#site-header');

    if (!header) return;

    const updateHeader = () => {

        const isScrolled = window.scrollY > 40;

        header.classList.toggle('bg-kraken-black/90', isScrolled);
        header.classList.toggle('backdrop-blur-xl', isScrolled);
        header.classList.toggle('border-kraken-ivory/10', isScrolled);
        header.classList.toggle('shadow-lg', isScrolled);

    };

    updateHeader();

    window.addEventListener('scroll', updateHeader, {
        passive: true
    });

}


/* ============================================================
   MOBILE MENU
============================================================ */

function initMobileMenu() {

    const button = document.querySelector('#menu-toggle');
    const menu = document.querySelector('#mobile-menu');

    if (!button || !menu) return;

    const links = menu.querySelectorAll('a');
    const background = [...document.querySelectorAll('main, footer, #site-header a')];
    let previousInert = [];

    let isOpen = false;


    const openMenu = () => {

        isOpen = true;

        menu.classList.remove('hidden');

        document.body.classList.add('overflow-hidden');

        button.setAttribute('aria-expanded', 'true');
        button.setAttribute('aria-label', 'Cerrar menú');
        previousInert = background.map(element => element.inert);
        background.forEach(element => { element.inert = true; });
        links[0]?.focus();

    };


    const closeMenu = (restoreFocus = true) => {

        if (!isOpen) return;

        isOpen = false;

        menu.classList.add('hidden');

        document.body.classList.remove('overflow-hidden');

        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'Abrir menú');
        background.forEach((element, index) => { element.inert = previousInert[index]; });
        if (restoreFocus) button.focus();

    };


    button.addEventListener('click', () => {

        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }

    });


    links.forEach(link => {

        link.addEventListener('click', () => closeMenu(false));

    });


    window.addEventListener('keydown', event => {

        if (event.key === 'Escape' && isOpen) {
            event.preventDefault();
            closeMenu();
        }

        if (event.key === 'Tab' && isOpen) {
            const focusable = [button, ...links];
            const index = focusable.indexOf(document.activeElement);
            const next = (index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
            event.preventDefault();
            focusable[next].focus();
        }

    });

    window.matchMedia('(min-width: 1280px)').addEventListener('change', event => {
        if (event.matches && isOpen) {
            closeMenu(false);
            document.querySelector('#site-header nav a')?.focus();
        }
    });

}


/* ============================================================
   REDUCED MOTION
============================================================ */

function prefersReducedMotion() {

    return window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

}


/* ============================================================
   POINTER DEVICE
   Evitamos efectos de ratón en móvil
============================================================ */

function hasFinePointer() {

    return window.matchMedia(
        '(pointer: fine)'
    ).matches;

}


/* ============================================================
   GLOBAL CURSOR LIGHT
============================================================ */

function initGlobalCursorLight() {

    if (!hasFinePointer()) return;
    if (prefersReducedMotion()) return;

    const cursorLight =
        document.createElement('div');

    cursorLight.id = 'cursor-light';
    cursorLight.setAttribute('aria-hidden', 'true');

    document.body.appendChild(cursorLight);

    const hero =
        document.querySelector('#inicio');

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;

    let currentX = targetX;
    let currentY = targetY;

    const updateVisibility = visible => {

        cursorLight.style.opacity =
            visible ? '1' : '0';

    };

    window.addEventListener(
        'mousemove',
        event => {

            targetX = event.clientX;
            targetY = event.clientY;

            updateVisibility(true);

        },
        {
            passive: true
        }
    );

    document.documentElement.addEventListener(
        'mouseleave',
        () => updateVisibility(false)
    );

    if (hero) {

        hero.addEventListener(
            'mouseenter',
            () => cursorLight.classList.add('hero-active')
        );

        hero.addEventListener(
            'mouseleave',
            () => cursorLight.classList.remove('hero-active')
        );

    }

    const animate = () => {

        currentX +=
            (targetX - currentX) * 0.075;

        currentY +=
            (targetY - currentY) * 0.075;

        cursorLight.style.transform =
            `translate3d(
                ${currentX}px,
                ${currentY}px,
                0
            ) translate(-50%, -50%)`;

        window.requestAnimationFrame(animate);

    };

    animate();

}


/* ============================================================
   REVEAL ON SCROLL
============================================================ */

function initRevealAnimations() {

    const elements = document.querySelectorAll('[data-reveal]:not(#inicio [data-reveal]):not(#manifiesto [data-reveal])');

    if (!elements.length) return;


    /*
        Si el usuario prefiere reducir movimiento,
        mostramos todo inmediatamente.
    */

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {

        elements.forEach(element => {

            element.classList.add('is-visible');

        });

        return;

    }


    const observer = new IntersectionObserver(

        entries => {

            entries.forEach(entry => {

                if (!entry.isIntersecting) return;

                const element = entry.target;

                const delay =
                    Number(element.dataset.revealDelay) || 0;


                window.setTimeout(() => {

                    element.classList.add('is-visible');

                }, delay);


                observer.unobserve(element);

            });

        },

        {
            threshold: 0.15,
            rootMargin: '0px 0px -60px 0px'
        }

    );


    elements.forEach(element => {

        // Content is visible by default, including when JavaScript cannot load.
        // Only this working observer opts elements into the reveal animation.
        if (!element.matches(':focus-within')) element.classList.add('reveal-pending');
        observer.observe(element);
        element.addEventListener('focusin', () => {
            element.classList.add('is-visible');
            observer.unobserve(element);
        }, { once: true });

    });

}


/* ============================================================
   MAGNETIC BUTTONS

   Los botones siguen ligeramente al cursor.
============================================================ */

function initMagneticElements() {

    if (!hasFinePointer()) return;


    const elements =
        document.querySelectorAll('[data-magnetic]');

    const reset = element => {
        element.style.transform = 'translate(0px, 0px)';
        element.classList.remove('is-lit');
    };
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
        if (event.matches) elements.forEach(reset);
    });


    elements.forEach(element => {

        const strength = 0.22;


        element.addEventListener('mousemove', event => {

            if (prefersReducedMotion()) return;

            const rect =
                element.getBoundingClientRect();


            const centerX =
                rect.left + rect.width / 2;

            const centerY =
                rect.top + rect.height / 2;


            const deltaX =
                event.clientX - centerX;

            const deltaY =
                event.clientY - centerY;


            element.style.transform =
                `translate(
                    ${deltaX * strength}px,
                    ${deltaY * strength}px
                )`;

            if (element.hasAttribute('data-light-button')) {

                element.style.setProperty(
                    '--mouse-x',
                    `${event.clientX - rect.left}px`
                );

                element.style.setProperty(
                    '--mouse-y',
                    `${event.clientY - rect.top}px`
                );

                element.classList.add('is-lit');

            }

        });


        element.addEventListener('mouseleave', () => {

            element.style.transform =
                'translate(0px, 0px)';

            element.classList.remove('is-lit');

        });

    });

}


/* ============================================================
    LIGHT CARDS

   Genera iluminación roja siguiendo el cursor.
============================================================ */

function initLightCards() {

    if (!hasFinePointer()) return;


    const cards =
          document.querySelectorAll('[data-light-card]');


    cards.forEach(card => {

        card.addEventListener('mousemove', event => {

            const rect =
                card.getBoundingClientRect();


            const x =
                event.clientX - rect.left;

            const y =
                event.clientY - rect.top;


            card.style.setProperty(
                '--mouse-x',
                `${x}px`
            );

            card.style.setProperty(
                '--mouse-y',
                `${y}px`
            );


            card.classList.add('is-lit');

        });


        card.addEventListener('mouseleave', () => {

            card.classList.remove('is-lit');

        });

        card.addEventListener('focusin', () => {

            card.classList.add('is-lit');

        });

        card.addEventListener('focusout', () => {

            card.classList.remove('is-lit');

        });

    });

}


/* ============================================================
   PARALLAX
============================================================ */

function initParallax() {

    if (!hasFinePointer()) return;
    if (prefersReducedMotion()) return;


    const elements =
        document.querySelectorAll('[data-parallax]');


    if (!elements.length) return;


    let ticking = false;


    const updateParallax = () => {

        const scrollY = window.scrollY;


        elements.forEach(element => {

            const speed =
                Number(element.dataset.parallaxSpeed) || 0.08;


            const offset =
                scrollY * speed;


            element.style.transform =
                `translate3d(0, ${offset}px, 0) scale(1.05)`;

        });


        ticking = false;

    };


    window.addEventListener(
        'scroll',
        () => {

            if (ticking) return;

            ticking = true;

            window.requestAnimationFrame(
                updateParallax
            );

        },
        {
            passive: true
        }
    );


    updateParallax();

}


/* ============================================================
   SMOOTH ANCHORS

   Complementa scroll-smooth de Tailwind y evita que
   el header tape el comienzo de las secciones.
============================================================ */

function initSmoothAnchors() {

    const anchors =
        document.querySelectorAll('a[href^="#"]');


    anchors.forEach(anchor => {

        anchor.addEventListener(
            'click',
            event => {

                if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;

                const href =
                    anchor.getAttribute('href');


                /*
                    "#" solo no representa una sección.
                */

                if (!href || href === '#') return;


                const target =
                    document.querySelector(href);


                if (!target) return;


                event.preventDefault();

                if (window.location.hash !== href) window.history.pushState(null, '', href);

                if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
                target.classList.add('is-visible');
                target.focus({ preventScroll: true });


                const header =
                    document.querySelector(
                        '#site-header'
                    );


                const headerHeight =
                    header?.offsetHeight || 0;


                const targetPosition =
                    target.getBoundingClientRect().top
                    + window.scrollY
                    - headerHeight;


                window.scrollTo({

                    top: targetPosition,

                    behavior:
                        prefersReducedMotion()
                            ? 'auto'
                            : 'smooth'

                });

            }
        );

    });

}
