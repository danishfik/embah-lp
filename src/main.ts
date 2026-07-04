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
if (!prefersReducedMotion) {
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      }
    );
  });

  gsap.utils.toArray<HTMLElement>('[data-reveal-group]').forEach((group) => {
    const items = Array.from(group.children) as HTMLElement[];
    gsap.fromTo(
      items,
      { opacity: 0, y: 44 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: group, start: 'top 82%' },
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

/* ============ REFRESH ON LOAD (fonts / images can shift layout) ============ */
window.addEventListener('load', () => ScrollTrigger.refresh());
