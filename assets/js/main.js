document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    // Toggle Mobile Menu
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        
        // Simple Animation for Hamburger
        const bars = document.querySelectorAll('.bar');
        bars[0].classList.toggle('rotate-down');
        bars[1].classList.toggle('fade-out');
        bars[2].classList.toggle('rotate-up');
    });

    // Close menu when a link is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    // Simple Form Submission Alert
    const contactForm = document.getElementById('contactForm');
    if(contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for reaching out to Lushy Crown! We will contact you shortly to reign over your crown.');
            contactForm.reset();
        });
    }

    // Sticky Nav Shadow on Scroll
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('nav');
        if (window.scrollY > 50) {
            nav.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
        } else {
            nav.style.boxShadow = 'none';
        }
    });
});