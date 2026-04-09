/**
 * KÜLFÜN — GLACIAL MONOLITH
 * main.js — Interactive Engine
 *
 * Features:
 * - Summit Progress floating scroll bar
 * - Hero parallax (mouse + scroll)
 * - Reveal-on-scroll (IntersectionObserver)
 * - Smooth hash navigation
 * - Nav glassmorphism intensifier on scroll
 * - Text scramble for hero eyebrow
 */

'use strict';

/* ─────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/* ─────────────────────────────────────────────
   1. SUMMIT PROGRESS BAR
   Fills from bottom to top as user scrolls
───────────────────────────────────────────── */
(function initSummitProgress() {
    const fill = qs('#summit-fill');
    if (!fill) return;

    const update = () => {
        const scrolled  = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const pct       = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;
        fill.style.height = `${clamp(pct, 0, 100)}%`;
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
})();

/* ─────────────────────────────────────────────
   2. NAV SCROLL STATE
   Intensifies backdrop-filter on scroll
───────────────────────────────────────────── */
(function initNavScroll() {
    const nav = qs('#main-nav');
    if (!nav) return;

    const onScroll = () => {
        if (window.scrollY > 60) {
            nav.style.background = 'rgba(10, 10, 10, 0.95)';
        } else {
            nav.style.background = 'rgba(10, 10, 10, 0.72)';
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ─────────────────────────────────────────────
   3. HERO PARALLAX
   - Scroll-based: image drifts at 40% speed
   - Mouse-based: subtle tilt on cursor move
───────────────────────────────────────────── */
(function initHeroParallax() {
    const layer = qs('#hero-parallax');
    if (!layer) return;

    // Scroll parallax
    const onScroll = () => {
        const scrolled = window.scrollY;
        const offset   = scrolled * 0.4;
        layer.style.transform = `translateY(${offset}px)`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Mouse parallax (subtle tilt)
    const hero = qs('#hero');
    if (!hero) return;

    hero.addEventListener('mousemove', (e) => {
        const { left, top, width, height } = hero.getBoundingClientRect();
        const xPct = ((e.clientX - left) / width  - 0.5) * 2;
        const yPct = ((e.clientY - top)  / height - 0.5) * 2;
        const moveX = xPct * 12;
        const moveY = yPct * 6;
        layer.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    hero.addEventListener('mouseleave', () => {
        layer.style.transform = 'translate(0, 0)';
        layer.style.transition = 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)';
        setTimeout(() => { layer.style.transition = ''; }, 800);
    });
})();

/* ─────────────────────────────────────────────
   4. REVEAL ON SCROLL
   Uses IntersectionObserver for performance
   Staggers delays via .reveal-delay-* classes
───────────────────────────────────────────── */
(function initRevealOnScroll() {
    const elements = qsa('.reveal');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px'
    });

    elements.forEach(el => observer.observe(el));
})();

/* ─────────────────────────────────────────────
   5. SMOOTH HASH SCROLL
   Intercepts all anchor clicks with #hash hrefs
───────────────────────────────────────────── */
(function initSmoothScroll() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        e.preventDefault();

        const targetId = link.getAttribute('href').slice(1);
        const target   = document.getElementById(targetId);
        if (!target) return;

        const navHeight = qs('#main-nav')?.offsetHeight ?? 70;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight;

        window.scrollTo({ top, behavior: 'smooth' });
    });
})();

/* ─────────────────────────────────────────────
   6. TEXT SCRAMBLE — Hero eyebrow glitch effect
───────────────────────────────────────────── */
(function initTextScramble() {
    const el = qs('.hero-eyebrow');
    if (!el) return;

    const CHARS = '!<>-_\\/[]{}—=+*^?#________';
    const original = el.textContent;
    let frame = 0;
    let resolve;

    const scramble = () => {
        let output = '';
        const length = original.length;

        for (let i = 0; i < length; i++) {
            if (i < frame / 3) {
                output += original[i];
            } else {
                output += CHARS[Math.floor(Math.random() * CHARS.length)];
            }
        }

        el.textContent = output;
        frame++;

        if (frame < length * 3) {
            requestAnimationFrame(scramble);
        } else {
            el.textContent = original;
        }
    };

    // Start after hero fade-in animation delay (0.4s)
    setTimeout(() => requestAnimationFrame(scramble), 1600);
})();

/* ─────────────────────────────────────────────
   7. TECH CELL COUNT-UP ANIMATION
   Numbers count up when section is visible
───────────────────────────────────────────── */
(function initCountUp() {
    const cells = qsa('.tech-cell-number');
    if (!cells.length) return;

    const parseNumber = (el) => {
        const text = el.textContent.trim();
        // Strip non-numeric suffix text (children), get just the lead number
        return parseFloat(el.childNodes[0]?.textContent ?? text) || 0;
    };

    const animateCount = (el, target, duration = 1600) => {
        const start     = performance.now();
        const suffix    = el.querySelector('.tech-cell-unit');
        const suffixHTML = suffix ? suffix.outerHTML : '';
        const isDecimal = target % 1 !== 0;

        const tick = (now) => {
            const elapsed  = now - start;
            const progress = clamp(elapsed / duration, 0, 1);
            // Ease out quart
            const eased = 1 - Math.pow(1 - progress, 4);
            const current = isDecimal
                ? (target * eased).toFixed(1)
                : Math.round(target * eased);

            el.innerHTML = `${current}${suffixHTML}`;

            if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cell   = entry.target;
                const target = parseNumber(cell);
                animateCount(cell, target);
                observer.unobserve(cell);
            }
        });
    }, { threshold: 0.5 });

    cells.forEach(cell => observer.observe(cell));
})();

/* ─────────────────────────────────────────────
   8. FUEL CARDS — Magnetic hover effect
───────────────────────────────────────────── */
(function initMagneticCards() {
    const cards = qsa('.fuel-card');
    if (!cards.length) return;

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const { left, top, width, height } = card.getBoundingClientRect();
            const x = ((e.clientX - left) / width  - 0.5) * 14;
            const y = ((e.clientY - top)  / height - 0.5) * 10;
            card.style.transform = `translateY(-8px) rotateY(${x}deg) rotateX(${-y}deg)`;
            card.style.transition = 'transform 0.1s linear';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
        });
    });
})();

/* ─────────────────────────────────────────────
   9. "48" COMMITMENT — Machine Screen Flicker
   Simulates a vending machine LED display on hover
───────────────────────────────────────────── */
(function initFlicker48() {
    const num = qs('.commitment-number');
    if (!num) return;

    num.addEventListener('mouseenter', () => {
        num.classList.add('is-flickering');
    });

    num.addEventListener('mouseleave', () => {
        // Short delay before stopping so last flicker finishes cleanly
        setTimeout(() => num.classList.remove('is-flickering'), 200);
    });
})();

/* ─────────────────────────────────────────────
   10. DEV SIGNATURE
───────────────────────────────────────────── */
console.log(
    '%c KÜLFÜN ',
    'background: #0A0A0A; color: #A0D8EF; font-size: 18px; font-family: monospace; font-weight: bold; padding: 10px 20px; border: 1px solid #2D2D2D;'
);
console.log(
    '%c // Glacial Monolith — Nutrición Autónoma ',
    'color: #707070; font-family: monospace; font-size: 11px;'
);
