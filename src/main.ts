import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import whatsappIcon from 'simple-icons/icons/whatsapp.svg?raw';
import instagramIcon from 'simple-icons/icons/instagram.svg?raw';
import facebookIcon from 'simple-icons/icons/facebook.svg?raw';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.getElementById('year')!.textContent = String(new Date().getFullYear());

/* ============ BRAND ICONS ============ */
const ICONS: Record<string, string> = {
  whatsapp: whatsappIcon,
  instagram: instagramIcon,
  facebook: facebookIcon,
};
document.querySelectorAll<HTMLElement>('[data-icon]').forEach((el) => {
  const icon = ICONS[el.dataset.icon ?? ''];
  if (icon) el.insertAdjacentHTML('afterbegin', icon);
});

/* ============ HEADER: scrolled state + mobile nav ============ */
const header = document.querySelector<HTMLElement>('.site-header')!;
const navToggle = document.getElementById('navToggle')!;
const mainNav = document.getElementById('mainNav')!;

const setScrolled = () => header.classList.toggle('scrolled', window.scrollY > 40);
setScrolled();
window.addEventListener('scroll', setScrolled, { passive: true });

const setNavOpen = (isOpen: boolean) => {
  mainNav.classList.toggle('open', isOpen);
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('nav-open', isOpen);
};

navToggle.addEventListener('click', () => setNavOpen(!mainNav.classList.contains('open')));

// Clicking the dimmed backdrop (outside the drawer panel) closes the menu
mainNav.addEventListener('click', (e) => {
  if (e.target === mainNav) setNavOpen(false);
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setNavOpen(false));
});

/* ============ HERO INTRO ============ */
const heroEls = gsap.utils.toArray<HTMLElement>('[data-hero-el]');
if (prefersReducedMotion) {
  gsap.set(heroEls, { opacity: 1, y: 0 });
} else {
  gsap.set(heroEls, { opacity: 0, y: 34 });
  gsap
    .timeline({ delay: 0.2 })
    .to(heroEls, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.14 });

  // Subtle parallax drift on the hero dot pattern
  gsap.to('.hero-pattern', {
    yPercent: 18,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* ============ SCROLL REVEALS ============ */
// scrub ties animation progress directly to scroll position, so scrolling
// down plays it forward and scrolling back up plays it in reverse.
if (!prefersReducedMotion) {
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top 92%',
          end: 'top 58%',
          scrub: 0.4,
        },
      }
    );
  });

  gsap.utils.toArray<HTMLElement>('[data-reveal-group]').forEach((group) => {
    const items = Array.from(group.children) as HTMLElement[];
    gsap.fromTo(
      items,
      { opacity: 0, y: 55 },
      {
        opacity: 1,
        y: 0,
        ease: 'none',
        stagger: 0.12,
        scrollTrigger: {
          trigger: group,
          start: 'top 88%',
          end: 'top 30%',
          scrub: 0.4,
        },
      }
    );
  });
}

/* ============ STAT COUNTERS ============ */
const statNumbers = gsap.utils.toArray<HTMLElement>('.stat-number');
if (statNumbers.length) {
  const animateCounters = () => {
    statNumbers.forEach((el) => {
      const target = Number(el.dataset.count ?? '0');
      const counter = { value: 0 };
      gsap.to(counter, {
        value: target,
        duration: prefersReducedMotion ? 0 : 1.6,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = Math.round(counter.value).toLocaleString('en-US');
        },
      });
    });
  };

  if (prefersReducedMotion) {
    animateCounters();
  } else {
    ScrollTrigger.create({
      trigger: '.stats-row',
      start: 'top 85%',
      once: true,
      onEnter: animateCounters,
    });
  }
}

/* ============ ABOUT PHOTO CROSSFADE ============ */
const aboutPhotos = gsap.utils.toArray<HTMLElement>('.about-photo');
if (aboutPhotos.length > 1) {
  let aboutIndex = Math.max(
    aboutPhotos.findIndex((photo) => photo.classList.contains('is-active')),
    0
  );
  window.setInterval(() => {
    aboutPhotos[aboutIndex].classList.remove('is-active');
    aboutIndex = (aboutIndex + 1) % aboutPhotos.length;
    aboutPhotos[aboutIndex].classList.add('is-active');
  }, 6000);
}

/* ============ FEEDBACK CAROUSEL ============ */
const feedbackSlides = gsap.utils.toArray<HTMLElement>('.feedback-slide');
const feedbackDots = gsap.utils.toArray<HTMLElement>('.feedback-dot');
if (feedbackSlides.length) {
  let activeIndex = Math.max(
    feedbackSlides.findIndex((slide) => slide.classList.contains('is-active')),
    0
  );
  let timer: number;

  const goToSlide = (index: number) => {
    const nextIndex = (index + feedbackSlides.length) % feedbackSlides.length;
    if (nextIndex === activeIndex) return;
    feedbackSlides[activeIndex].classList.remove('is-active');
    feedbackDots[activeIndex]?.classList.remove('is-active');
    activeIndex = nextIndex;
    feedbackSlides[activeIndex].classList.add('is-active');
    feedbackDots[activeIndex]?.classList.add('is-active');
  };

  const startAutoplay = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => goToSlide(activeIndex + 1), 5000);
  };

  feedbackDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goToSlide(index);
      startAutoplay();
    });
  });

  const feedbackSlider = document.querySelector<HTMLElement>('.feedback-slider')!;
  const feedbackTrack = document.querySelector<HTMLElement>('.feedback-track')!;
  feedbackSlider.addEventListener('mouseenter', () => window.clearInterval(timer));
  feedbackSlider.addEventListener('mouseleave', startAutoplay);

  let dragStartX = 0;
  let dragDeltaX = 0;
  let isDragging = false;
  let dragRaf = 0;
  const swipeThreshold = 40;
  const maxDragOffset = 60;

  const dampen = (delta: number) => {
    const sign = Math.sign(delta);
    const abs = Math.abs(delta);
    return sign * maxDragOffset * (1 - Math.exp(-abs / maxDragOffset));
  };

  const startDrag = (clientX: number) => {
    isDragging = true;
    dragStartX = clientX;
    dragDeltaX = 0;
    window.clearInterval(timer);
    feedbackTrack.classList.add('is-dragging');
  };

  const updateDrag = (clientX: number) => {
    if (!isDragging) return;
    dragDeltaX = clientX - dragStartX;
    cancelAnimationFrame(dragRaf);
    dragRaf = requestAnimationFrame(() => {
      feedbackTrack.style.transform = `translateX(${dampen(dragDeltaX)}px)`;
    });
  };

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    cancelAnimationFrame(dragRaf);
    feedbackTrack.classList.remove('is-dragging');
    feedbackTrack.style.transform = '';
    if (dragDeltaX < -swipeThreshold) {
      goToSlide(activeIndex + 1);
    } else if (dragDeltaX > swipeThreshold) {
      goToSlide(activeIndex - 1);
    }
    startAutoplay();
  };

  feedbackTrack.addEventListener('touchstart', (e) => {
    startDrag(e.touches[0].clientX);
  }, { passive: true });

  feedbackTrack.addEventListener('touchmove', (e) => {
    updateDrag(e.touches[0].clientX);
  }, { passive: true });

  feedbackTrack.addEventListener('touchend', endDrag);

  feedbackTrack.addEventListener('mousedown', (e) => {
    startDrag(e.clientX);
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    updateDrag(e.clientX);
  });

  window.addEventListener('mouseup', endDrag);

  startAutoplay();
}

/* ============ REFRESH ON LOAD (fonts / images can shift layout) ============ */
window.addEventListener('load', () => ScrollTrigger.refresh());
