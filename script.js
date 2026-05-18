// Initialize Lucide Icons
lucide.createIcons();

// Data structure (now loaded dynamically)
let galleryData = [];

// DOM Elements
const galleryGrid = document.getElementById('gallery');
const filterBtns = document.querySelectorAll('.filter-btn');
const loader = document.getElementById('loader');
const progressFill = document.querySelector('.progress-fill');
const lightbox = document.getElementById('lightbox');
const lightboxMedia = document.getElementById('lightbox-media');
const lightboxCaption = document.getElementById('lightbox-caption');
const closeLightbox = document.querySelector('.close-lightbox');

// Load Data from JSON
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('No se pudo cargar data.json');
        galleryData = await response.json();
        renderGallery();
    } catch (error) {
        console.error("Error cargando el álbum:", error);
        // Fallback or message to user
        galleryGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">
            No se encontró el archivo de datos. <br> 
            Ejecuta <code>php sync.php</code> en tu terminal para generar la galería.
        </p>`;
    }
}

// Initial Load Animation
window.addEventListener('load', () => {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                gsap.to(loader, { opacity: 0, duration: 0.8, onComplete: () => {
                    loader.style.display = 'none';
                    initAnimations();
                }});
            }, 500);
        }
        progressFill.style.width = `${progress}%`;
    }, 100);
});

// Render Gallery
function renderGallery(filter = 'all') {
    galleryGrid.innerHTML = '';
    
    // Filter using the 'category' property instead of 'type'
    const filteredData = filter === 'all' 
        ? galleryData 
        : galleryData.filter(item => item.category === filter);

    filteredData.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.dataset.id = item.id;
        
        const mediaHtml = item.type === 'img' 
            ? `<img src="${item.src}" alt="${item.caption}" loading="lazy">`
            : `<video src="${item.src}" muted loop playsinline></video>`;

        div.innerHTML = `
            ${mediaHtml}
            <div class="item-type">
                <i data-lucide="${item.type === 'img' ? 'image' : 'video'}"></i>
            </div>
            <div class="item-overlay">
                <p class="item-caption">${item.caption}</p>
                <p class="item-date">${item.date}</p>
            </div>
        `;

        div.addEventListener('click', () => openModal(item));
        
        // Autoplay video on hover (preserved for future video support)
        if (item.type === 'vid') {
            div.addEventListener('mouseenter', () => div.querySelector('video').play());
            div.addEventListener('mouseleave', () => div.querySelector('video').pause());
        }

        galleryGrid.appendChild(div);
    });

    lucide.createIcons();
    
    // Animate items entrance
    gsap.fromTo('.gallery-item', 
        { opacity: 0, y: 50, scale: 0.9 },
        { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            duration: 0.8, 
            stagger: 0.1, 
            ease: "power3.out" 
        }
    );
}

// GSAP Animations
function initAnimations() {
    gsap.from('.reveal-text', {
        opacity: 0,
        y: 100,
        duration: 1.2,
        ease: "power4.out"
    });

    gsap.from('.subtitle', {
        opacity: 0,
        y: 20,
        duration: 1,
        delay: 0.5,
        ease: "power3.out"
    });
}

// Filter logic
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderGallery(btn.dataset.filter);
    });
});

// Lightbox
function openModal(item) {
    lightboxMedia.innerHTML = item.type === 'img'
        ? `<img src="${item.src}">`
        : `<video src="${item.src}" controls autoplay></video>`;
    
    lightboxCaption.textContent = item.caption;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    gsap.from('.lightbox-content', {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.7)"
    });
}

closeLightbox.addEventListener('click', () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
});

lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Confetti Effect
function fireConfetti() {
    const count = 200;
    const defaults = {
        origin: { y: 0.7 },
        colors: ['#ff3e81', '#ff9a3e', '#ffffff']
    };

    function fire(particleRatio, opts) {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
        });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
}

// Trigger confetti when reaching footer
let confettiFired = false;
window.addEventListener('scroll', () => {
    const footer = document.querySelector('.footer');
    const position = footer.getBoundingClientRect();
    
    if (!confettiFired && position.top < window.innerHeight) {
        fireConfetti();
        confettiFired = true;
    }
});

// Password Protection Logic
const passwordOverlay = document.getElementById('password-overlay');
const pinInput = document.getElementById('pin-input');
const pinError = document.getElementById('pin-error');

// For this demo, PIN is 1234. Change as needed.
const CORRECT_PIN = '1234';

if (localStorage.getItem('album_unlocked') === 'true') {
    if (passwordOverlay) passwordOverlay.style.display = 'none';
}

if (pinInput) {
    pinInput.addEventListener('input', (e) => {
        if (e.target.value === CORRECT_PIN) {
            localStorage.setItem('album_unlocked', 'true');
            gsap.to(passwordOverlay, { 
                opacity: 0, 
                duration: 0.5, 
                onComplete: () => passwordOverlay.style.display = 'none' 
            });
        } else if (e.target.value.length === 4) {
            pinError.style.opacity = '1';
            setTimeout(() => {
                pinInput.value = '';
                pinError.style.opacity = '0';
            }, 1000);
        }
    });
}

// Share Modal Logic
const shareModal = document.getElementById('share-modal');
const qrTrigger = document.getElementById('qr-footer-trigger');
const closeShareBtn = document.getElementById('close-share');
const btnCopyLink = document.getElementById('btn-copy-link');

function openShareModal() {
    shareModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    gsap.fromTo('.share-card', 
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
    );
}

function closeShareModal() {
    gsap.to('.share-card', {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
            shareModal.classList.remove('active');
            if (!lightbox.classList.contains('active')) {
                document.body.style.overflow = 'auto';
            }
        }
    });
}

if (qrTrigger) qrTrigger.addEventListener('click', openShareModal);
if (closeShareBtn) closeShareBtn.addEventListener('click', closeShareModal);

shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) closeShareModal();
});

// Close modal on Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shareModal.classList.contains('active')) {
        closeShareModal();
    }
});

// Copy Link to Clipboard with Premium Visual Feedback
if (btnCopyLink) {
    btnCopyLink.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            
            // Visual success feedback
            btnCopyLink.classList.add('success');
            const btnText = btnCopyLink.querySelector('.btn-text');
            
            const originalText = btnText.textContent;
            btnText.textContent = '¡Enlace Copiado!';
            
            const originalIconHTML = btnCopyLink.querySelector('svg')?.outerHTML || '';
            const checkIconHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check btn-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            
            const iconElement = btnCopyLink.querySelector('svg') || btnCopyLink.querySelector('i');
            if (iconElement) {
                iconElement.outerHTML = checkIconHTML;
            }
            
            // Fire beautiful share-themed confetti
            fireShareConfetti();
            
            setTimeout(() => {
                btnCopyLink.classList.remove('success');
                btnText.textContent = originalText;
                const newIconElement = btnCopyLink.querySelector('svg');
                if (newIconElement && originalIconHTML) {
                    newIconElement.outerHTML = originalIconHTML;
                }
            }, 2000);
            
        } catch (err) {
            console.error('Error al copiar el enlace: ', err);
            alert('No se pudo copiar el enlace automáticamente. Copia la URL de tu navegador.');
        }
    });
}

// Special Sharing Confetti Burst
function fireShareConfetti() {
    confetti({
        particleCount: 40,
        spread: 60,
        origin: { x: 0.3, y: 0.6 },
        colors: ['#ff3e81', '#ff9a3e', '#10b981']
    });
    confetti({
        particleCount: 40,
        spread: 60,
        origin: { x: 0.7, y: 0.6 },
        colors: ['#ff3e81', '#ff9a3e', '#10b981']
    });
}

// Initial Render
loadData();
