document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const bars = document.querySelectorAll('.bar');
    const nav = document.querySelector('nav');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', String(isOpen));

            bars[0]?.classList.toggle('rotate-down');
            bars[1]?.classList.toggle('fade-out');
            bars[2]?.classList.toggle('rotate-up');
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                bars[0]?.classList.remove('rotate-down');
                bars[1]?.classList.remove('fade-out');
                bars[2]?.classList.remove('rotate-up');
            });
        });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            alert('Thanks for contacting PFN Exchange. Support will help you with your payment request shortly.');
            contactForm.reset();
        });
    }

    const updateNavState = () => {
        if (!nav) {
            return;
        }
        nav.classList.toggle('is-scrolled', window.scrollY > 24);
    };

    updateNavState();
    window.addEventListener('scroll', updateNavState, { passive: true });
});
