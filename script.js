// ============================================
// HAMBURGER MENU RESPONSIVE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Create hamburger if it doesn't exist
    if (!document.querySelector('.hamburger')) {
        const navbar = document.querySelector('.navbar');
        const hamburger = document.createElement('div');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        navbar.insertBefore(hamburger, document.querySelector('.user-section'));
    }

    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    // Toggle menu on hamburger click
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close menu when a link is clicked
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = document.querySelector('.navbar').contains(event.target);
        
        if (!isClickInsideNav && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    // Handle window resize
    let isDesktop = window.innerWidth > 768;
    
    window.addEventListener('resize', function() {
        const currentSize = window.innerWidth > 768;
        
        if (currentSize !== isDesktop) {
            isDesktop = currentSize;
            
            if (isDesktop) {
                // Remove mobile menu
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        }
    });
});

// ============================================
// MODAL HANDLING
// ============================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

// ============================================
// SMOOTH SCROLL
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ============================================
// FORM VALIDATION
// ============================================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// ============================================
// LOADING ANIMATION
// ============================================
window.addEventListener('load', function() {
    document.body.style.opacity = '1';
});

// ============================================
// MOBILE MENU HEIGHT ADJUSTMENT
// ============================================
function adjustMenuHeight() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu && navMenu.classList.contains('active')) {
        const menuItems = navMenu.querySelectorAll('li').length;
        const itemHeight = 60; // approximate height per item
        navMenu.style.maxHeight = (menuItems * itemHeight) + 'px';
    }
}

window.addEventListener('resize', adjustMenuHeight);

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// ============================================
// ANALYTICS & TRACKING
// ============================================
function trackEvent(eventName, details = {}) {
    console.log(`Event: ${eventName}`, details);
    // Add your analytics code here
}

// ============================================
// INITIALIZATION
// ============================================
(function init() {
    console.log('Chaos of Evoourth\'s initialized');
    adjustMenuHeight();
})();
