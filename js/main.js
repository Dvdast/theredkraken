'use strict';

/* ============================================================
   THE RED KRAKEN
   Main interactions
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    initHeader();
    initMobileMenu();
    initRevealAnimations();
    initGlobalCursorLight();
    initMagneticElements();
    initLightCards();
    initParallax();
    initInteractiveHero();
    initSeamlessVideoLoop();
    initDice();
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

        header.classList.toggle('bg-[#08090B]/90', isScrolled);
        header.classList.toggle('backdrop-blur-xl', isScrolled);
        header.classList.toggle('border-white/10', isScrolled);
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

    let isOpen = false;


    const openMenu = () => {

        isOpen = true;

        menu.classList.remove('hidden');

        document.body.classList.add('overflow-hidden');

        button.setAttribute('aria-expanded', 'true');
        button.setAttribute('aria-label', 'Cerrar menú');

    };


    const closeMenu = () => {

        isOpen = false;

        menu.classList.add('hidden');

        document.body.classList.remove('overflow-hidden');

        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'Abrir menú');

    };


    button.addEventListener('click', () => {

        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }

    });


    links.forEach(link => {

        link.addEventListener('click', closeMenu);

    });


    window.addEventListener('keydown', event => {

        if (event.key === 'Escape' && isOpen) {
            closeMenu();
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

    const elements = document.querySelectorAll('[data-reveal]');

    if (!elements.length) return;


    /*
        Si el usuario prefiere reducir movimiento,
        mostramos todo inmediatamente.
    */

    if (prefersReducedMotion()) {

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

        observer.observe(element);

    });

}


/* ============================================================
   MAGNETIC BUTTONS

   Los botones siguen ligeramente al cursor.
============================================================ */

function initMagneticElements() {

    if (!hasFinePointer()) return;
    if (prefersReducedMotion()) return;


    const elements =
        document.querySelectorAll('[data-magnetic]');


    elements.forEach(element => {

        const strength = 0.22;


        element.addEventListener('mousemove', event => {

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
   INTERACTIVE CINEMATIC HERO
============================================================ */

function initInteractiveHero() {

    if (!hasFinePointer()) return;
    if (prefersReducedMotion()) return;

    const hero =
        document.querySelector('#inicio');

    const environment =
        document.querySelector('#hero-environment');

    const kraken =
        document.querySelector('#hero-kraken');

    const glow =
        document.querySelector('#hero-red-glow');

    const fogBack =
        document.querySelector('#hero-fog-back');

    const fogFront =
        document.querySelector('#hero-fog-front');

    const spotlight =
        document.querySelector('#hero-spotlight');

    const content =
        document.querySelector('#hero-content');

    if (
        !hero ||
        !environment ||
        !kraken ||
        !spotlight
    ) {
        return;
    }

    let targetX = 0;
    let targetY = 0;

    let currentX = 0;
    let currentY = 0;

    hero.addEventListener(
        'mouseenter',
        () => {

            spotlight.style.opacity = '1';

        }
    );

    hero.addEventListener(
        'mouseleave',
        () => {

            targetX = 0;
            targetY = 0;

            spotlight.style.opacity = '0';

        }
    );

    hero.addEventListener(
        'mousemove',
        event => {

            const rect =
                hero.getBoundingClientRect();

            const mouseX =
                event.clientX - rect.left;

            const mouseY =
                event.clientY - rect.top;

            targetX =
                (mouseX / rect.width - 0.5) * 2;

            targetY =
                (mouseY / rect.height - 0.5) * 2;

            const percentageX =
                (mouseX / rect.width) * 100;

            const percentageY =
                (mouseY / rect.height) * 100;

            spotlight.style.setProperty(
                '--hero-x',
                `${percentageX}%`
            );

            spotlight.style.setProperty(
                '--hero-y',
                `${percentageY}%`
            );

        },
        {
            passive: true
        }
    );

    const animate = () => {

        const easing = 0.045;

        currentX +=
            (targetX - currentX) * easing;

        currentY +=
            (targetY - currentY) * easing;

        if (kraken) {

            const x =
                currentX * -10;

            const y =
                currentY * -7;

            kraken.style.transform =
                `
                translate3d(
                    ${x}px,
                    ${y}px,
                    0
                )
                scale(1.08)
                `;

        }

        if (glow) {

            const x =
                currentX * 35;

            const y =
                currentY * 25;

            glow.style.transform =
                `translate3d(
                    ${x}px,
                    ${y}px,
                    0
                )`;

        }

        if (fogBack) {

            const x =
                currentX * 18;

            const y =
                currentY * 8;

            fogBack.style.transform =
                `translate3d(
                    ${x}px,
                    ${y}px,
                    0
                )`;

        }

        if (fogFront) {

            const x =
                currentX * -28;

            const y =
                currentY * -12;

            fogFront.style.transform =
                `translate3d(
                    ${x}px,
                    ${y}px,
                    0
                )`;

        }

        if (content) {

            const x =
                currentX * 4;

            const y =
                currentY * 3;

            content.style.transform =
                `translate3d(
                    ${x}px,
                    ${y}px,
                    0
                )`;

        }

        window.requestAnimationFrame(
            animate
        );

    };

    animate();

}


/* ============================================================
   SEAMLESS VIDEO LOOP (Dual Crossfade)
   Elimina el salto brusco en el loop de video mediante
   fundido cruzado entre dos elementos video superpuestos.
============================================================ */

function initSeamlessVideoLoop() {

    const videoA = document.querySelector('#hero-kraken-a');
    const videoB = document.querySelector('#hero-kraken-b');

    if (!videoA || !videoB) return;

    // Duración de la transición cruzada (en segundos)
    const CROSSFADE_TIME = 1.0;

    let activeVideo = videoA;
    let standbyVideo = videoB;
    let isFading = false;

    [videoA, videoB].forEach(v => {
        v.muted = true;
        v.playsInline = true;
    });

    const startActive = () => {
        const p = activeVideo.play();
        if (p !== undefined) {
            p.catch(() => {});
        }
    };

    if (activeVideo.readyState >= 2) {
        startActive();
    } else {
        activeVideo.addEventListener('canplay', startActive, { once: true });
    }

    const checkTime = () => {
        if (activeVideo && activeVideo.duration && !isFading) {
            const timeLeft = activeVideo.duration - activeVideo.currentTime;

            if (timeLeft <= CROSSFADE_TIME && timeLeft > 0) {
                isFading = true;

                // Preparar y reproducir el video en espera
                standbyVideo.currentTime = 0;
                const p = standbyVideo.play();
                if (p !== undefined) {
                    p.catch(() => {});
                }

                // Transición mediante clases Tailwind de opacidad
                standbyVideo.classList.remove('opacity-0');
                standbyVideo.classList.add('opacity-100');
                activeVideo.classList.remove('opacity-100');
                activeVideo.classList.add('opacity-0');

                // Tras finalizar la transición de opacidad, pausar y resetear
                setTimeout(() => {
                    activeVideo.pause();
                    activeVideo.currentTime = 0;

                    // Intercambiar referencia de video activo y en espera
                    const temp = activeVideo;
                    activeVideo = standbyVideo;
                    standbyVideo = temp;
                    isFading = false;
                }, CROSSFADE_TIME * 1000);
            }
        }

        window.requestAnimationFrame(checkTime);
    };

    window.requestAnimationFrame(checkTime);
}


/* ============================================================
   D20
============================================================ */

function initDice() {

    const button =
        document.querySelector('#roll-d20');

    const resultContainer =
        document.querySelector('#dice-result');

    const numberElement =
        document.querySelector('#dice-number');

    const messageElement =
        document.querySelector('#dice-message');

    const diceSection =
        button?.closest('.dice-section');


    if (
        !button ||
        !resultContainer ||
        !numberElement ||
        !messageElement
    ) {
        return;
    }


    let rolling = false;


    const messages = [

        {
            min: 1,
            max: 1,
            text:
                'El abismo devuelve tu mirada.'
        },

        {
            min: 2,
            max: 5,
            text:
                'Algo se mueve bajo la superficie.'
        },

        {
            min: 6,
            max: 9,
            text:
                'Escuchas algo en la oscuridad.'
        },

        {
            min: 10,
            max: 13,
            text:
                'El Kraken conoce tu nombre.'
        },

        {
            min: 14,
            max: 17,
            text:
                'Has llamado su atención.'
        },

        {
            min: 18,
            max: 19,
            text:
                'La oscuridad parece estar de tu lado.'
        },

        {
            min: 20,
            max: 20,
            text:
                'Esta vez... el Kraken te deja pasar.'
        }

    ];


    const getMessage = roll => {

        const message = messages.find(item => {

            return (
                roll >= item.min &&
                roll <= item.max
            );

        });


        return message?.text ?? '';
    };


    const rollDice = () => {

        if (rolling) return;

        rolling = true;


        button.disabled = true;

        button.classList.add(
            'opacity-50',
            'cursor-not-allowed'
        );


        resultContainer.classList.remove(
            'opacity-0'
        );


        /*
            Animación rápida mostrando números
            aleatorios antes del resultado.
        */

        let iterations = 0;

        const maxIterations = 14;


        const animation =
            window.setInterval(() => {

                const temporaryRoll =
                    Math.floor(
                        Math.random() * 20
                    ) + 1;


                numberElement.textContent =
                    temporaryRoll;


                iterations++;


                if (iterations >= maxIterations) {

                    window.clearInterval(animation);


                    const finalRoll =
                        Math.floor(
                            Math.random() * 20
                        ) + 1;


                    showDiceResult(finalRoll);

                }

            }, 70);

    };


    const showDiceResult = roll => {

        numberElement.textContent = roll;

        messageElement.textContent =
            getMessage(roll);

        resultContainer.classList.remove(
            'dice-pulse',
            'dice-critical'
        );

        diceSection?.classList.remove(
            'dice-fumble'
        );

        numberElement.style.textShadow = '';

        void resultContainer.offsetWidth;

        if (roll === 1) {

            resultContainer.classList.add('dice-pulse');
            diceSection?.classList.add('dice-fumble');

        } else if (roll === 20) {

            resultContainer.classList.add('dice-critical');

        } else {

            resultContainer.classList.add('dice-pulse');

        }


        /*
            Resultado especial para 1 y 20
        */

        if (roll === 1) {

            numberElement.classList.add(
                'scale-110'
            );

        }


        if (roll === 20) {

            numberElement.classList.add(
                'scale-125'
            );

            numberElement.style.textShadow =
                '0 0 40px rgba(197,30,48,.8)';

        }

        window.setTimeout(() => {

            resultContainer.classList.remove(
                'dice-pulse',
                'dice-critical'
            );

            diceSection?.classList.remove(
                'dice-fumble'
            );

        }, 850);


        window.setTimeout(() => {

            numberElement.classList.remove(
                'scale-110',
                'scale-125'
            );

        }, 500);


        window.setTimeout(() => {

            button.disabled = false;

            button.classList.remove(
                'opacity-50',
                'cursor-not-allowed'
            );

            rolling = false;

        }, 500);

    };


    button.addEventListener(
        'click',
        rollDice
    );

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