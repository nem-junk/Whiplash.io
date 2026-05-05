/* =========================================
   WHIPLASH — Scroll Reveal & Interactions
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

    // ===== SCROLL REVEAL =====
    // Add .reveal class to all elements that should animate in
    const revealTargets = [
        '.section-label', '.section-title', '.section-description',
        '.feature-tag', '.feature-title', '.feature-desc', '.feature-list',
        '.video-placeholder',
        '.stat-card', '.engine-card',
        '.cta-title', '.cta-desc', '.cta-button'
    ];

    revealTargets.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.classList.add('reveal');
        });
    });

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Stagger siblings
                const parent = entry.target.parentElement;
                const siblings = parent.querySelectorAll('.reveal');
                let delay = 0;

                siblings.forEach(sib => {
                    if (sib === entry.target || !sib.classList.contains('visible')) {
                        setTimeout(() => sib.classList.add('visible'), delay);
                        delay += 100;
                    }
                });

                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });

    // ===== NAV HIDE ON SCROLL =====
    let lastScroll = 0;
    const nav = document.getElementById('nav');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > lastScroll && currentScroll > 100) {
            nav.style.transform = 'translateY(-100%)';
        } else {
            nav.style.transform = 'translateY(0)';
        }

        lastScroll = currentScroll;
    }, { passive: true });

    // ===== SMOOTH ANCHOR LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ===== PARALLAX CROSSHAIRS =====
    const crosshairs = document.querySelectorAll('.crosshair');

    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        crosshairs.forEach((ch, i) => {
            const factor = (i + 1) * 5;
            ch.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
        });
    });

});
