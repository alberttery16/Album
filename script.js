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

// Initial Render
loadData();
