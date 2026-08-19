// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializeAccordion();
    initializeScrollAnimations();
    initializeButtonAnimations();
    initializeParticleEffect();
    initializeSmoothScrolling();
    initializeFormValidation();
});

// Accordion Functionality
function initializeAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const accordionItem = this.parentElement;
            const isActive = accordionItem.classList.contains('active');
            
            // Close all accordion items
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                accordionItem.classList.add('active');
                
                // Add a subtle animation effect
                const body = accordionItem.querySelector('.accordion-body');
                body.style.animation = 'fadeInUp 0.3s ease forwards';
            }
        });
    });
}

// Scroll Animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Add staggered animation for list items
                if (entry.target.tagName === 'SECTION') {
                    const listItems = entry.target.querySelectorAll('li');
                    listItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateX(0)';
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);
    
    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
    
    // Observe all list items
    document.querySelectorAll('li').forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
}

// Button Animations and Interactions
function initializeButtonAnimations() {
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(button => {
        // Add ripple effect
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
        
        // Add hover sound effect simulation
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Particle Effect for Hero Section
function initializeParticleEffect() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.style.position = 'absolute';
    particleContainer.style.top = '0';
    particleContainer.style.left = '0';
    particleContainer.style.width = '100%';
    particleContainer.style.height = '100%';
    particleContainer.style.pointerEvents = 'none';
    particleContainer.style.zIndex = '-1';
    hero.appendChild(particleContainer);
    
    // Create floating particles
    for (let i = 0; i < 15; i++) {
        createParticle(particleContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = Math.random() * 4 + 2 + 'px';
    particle.style.height = particle.style.width;
    particle.style.background = `rgba(${Math.random() > 0.5 ? '79, 70, 229' : '6, 182, 212'}, 0.3)`;
    particle.style.borderRadius = '50%';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animation = `float ${Math.random() * 3 + 2}s ease-in-out infinite`;
    particle.style.animationDelay = Math.random() * 2 + 's';
    
    container.appendChild(particle);
    
    // Remove and recreate particle after animation
    setTimeout(() => {
        if (particle.parentNode) {
            particle.remove();
            createParticle(container);
        }
    }, 5000);
}

// Smooth Scrolling for CTA links
function initializeSmoothScrolling() {
    const ctaLinks = document.querySelectorAll('a[href^="#"]');
    
    ctaLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Form Validation (if forms are added later)
function initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Add form validation logic here
            const inputs = form.querySelectorAll('input, textarea');
            let isValid = true;
            
            inputs.forEach(input => {
                if (input.hasAttribute('required') && !input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = '#ef4444';
                    input.style.background = 'rgba(239, 68, 68, 0.1)';
                } else {
                    input.style.borderColor = '#10b981';
                    input.style.background = 'rgba(16, 185, 129, 0.1)';
                }
            });
            
            if (isValid) {
                // Show success message
                showNotification('הטופס נשלח בהצלחה!', 'success');
            } else {
                showNotification('אנא מלא את כל השדות הנדרשים', 'error');
            }
        });
    });
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Dynamic Content Loading
function loadDynamicContent() {
    // Simulate loading workshop dates from an API
    const dates = [
        {
            type: 'morning',
            title: 'מועד בוקר - יולי',
            date: '11.07 | 11:00',
            price: '100 ש"ח'
        },
        {
            type: 'evening',
            title: 'מועד ערב - יוני',
            date: '25.06 | 20:30',
            price: '100 ש"ח'
        }
    ];
    
    // Update dates dynamically if needed
    dates.forEach((dateInfo, index) => {
        const cards = document.querySelectorAll('.card');
        if (cards[index]) {
            const card = cards[index];
            card.querySelector('h2').textContent = dateInfo.title;
            card.querySelectorAll('p')[0].textContent = dateInfo.date;
            card.querySelectorAll('p')[1].textContent = dateInfo.price;
        }
    });
}

// Performance Optimization
function optimizePerformance() {
    // Lazy load images if any are added
    const images = document.querySelectorAll('img[data-src]');
    if (images.length > 0) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// Keyboard Navigation Enhancement
function enhanceKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            if (e.target.classList.contains('accordion-header')) {
                e.preventDefault();
                e.target.click();
            }
        }
    });
}

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: rippleEffect 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes rippleEffect {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .notification {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(style);

// Initialize additional features
document.addEventListener('DOMContentLoaded', function() {
    loadDynamicContent();
    optimizePerformance();
    enhanceKeyboardNavigation();
});

// Add scroll-to-top functionality
window.addEventListener('scroll', function() {
    if (window.scrollY > 300) {
        if (!document.querySelector('.scroll-to-top')) {
            const scrollButton = document.createElement('button');
            scrollButton.className = 'scroll-to-top';
            scrollButton.innerHTML = '↑';
            scrollButton.style.cssText = `
                position: fixed;
                bottom: 2rem;
                left: 2rem;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: var(--gradient-primary);
                color: white;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                z-index: 1000;
                transition: all 0.3s ease;
                box-shadow: var(--shadow-medium);
            `;
            
            scrollButton.addEventListener('click', function() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
            
            document.body.appendChild(scrollButton);
        }
    } else {
        const scrollButton = document.querySelector('.scroll-to-top');
        if (scrollButton) {
            scrollButton.remove();
        }
    }
});