/**
 * Phantom Deck Runtime Engine
 * Handles manual slide navigation, GSAP animations, and optional TTS Auto-Play sync.
 */

window.PhantomDeck = (function() {
    let currentSlide = 0;
    let slides = [];
    let isAutoPlay = false;
    let ttsAudio = null;
    let bgmAudio = null;
    let timings = [];
    
    function init() {
        slides = document.querySelectorAll('.phantom-slide');
        if (slides.length === 0) return;

        // Hide all except first
        slides.forEach((s, i) => {
            if (i !== 0) s.style.display = 'none';
        });

        // Initialize audio elements if present
        ttsAudio = document.getElementById('tts-audio');
        bgmAudio = document.getElementById('bgm-audio');
        const timingEl = document.getElementById('timing-data');
        if (timingEl) {
            try {
                timings = JSON.parse(timingEl.textContent).entries || [];
            } catch (e) {
                console.warn('PhantomDeck: Failed to parse timings.json');
            }
        }

        // Setup manual keyboard navigation
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
            }
        });

        // Optional: trigger GSAP entry for first slide
        triggerSlideAnimation(0);
    }

    function goToSlide(index) {
        if (index < 0 || index >= slides.length || index === currentSlide) return;
        
        // Hide current
        slides[currentSlide].style.display = 'none';
        // Show next
        slides[index].style.display = 'flex';
        currentSlide = index;

        triggerSlideAnimation(currentSlide);
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    function triggerSlideAnimation(index) {
        // If the slide has a registered GSAP function in window.slideAnimations, call it
        if (window.slideAnimations && window.slideAnimations[index]) {
            // Kill existing timeline if active
            if (window.slideAnimations[index].tl) {
                window.slideAnimations[index].tl.kill();
            }
            window.slideAnimations[index].tl = window.slideAnimations[index].create();
            window.slideAnimations[index].tl.play();
        }
    }

    function startAutoPlay() {
        isAutoPlay = true;
        if (bgmAudio) {
            bgmAudio.volume = 0.25;
            bgmAudio.play();
        }
        if (ttsAudio) {
            ttsAudio.volume = 1.0;
            ttsAudio.play();
            
            // Sync slides with TTS
            ttsAudio.addEventListener('timeupdate', () => {
                const ct = ttsAudio.currentTime;
                // Find matching timing entry
                const currentTiming = timings.find(t => ct >= t.start && ct <= t.end);
                
                if (currentTiming && typeof currentTiming.slide_index !== 'undefined') {
                    if (currentSlide !== currentTiming.slide_index) {
                        goToSlide(currentTiming.slide_index);
                    }
                }
            });
        }
    }

    // Public API
    return {
        init,
        nextSlide,
        prevSlide,
        goToSlide,
        startAutoPlay
    };
})();

// Auto initialize on load
window.addEventListener('DOMContentLoaded', () => {
    window.PhantomDeck.init();
});
