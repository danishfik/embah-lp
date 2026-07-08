import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import whatsappIcon from 'simple-icons/icons/whatsapp.svg?raw';
import instagramIcon from 'simple-icons/icons/instagram.svg?raw';
import facebookIcon from 'simple-icons/icons/facebook.svg?raw';
import tiktokIcon from 'simple-icons/icons/tiktok.svg?raw';
import bgMusicUrl from './assets/bg-music.mp3?url';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.getElementById('year')!.textContent = String(new Date().getFullYear());

/* ============ BRAND ICONS ============ */
const ICONS: Record<string, string> = {
  whatsapp: whatsappIcon,
  instagram: instagramIcon,
  facebook: facebookIcon,
  tiktok: tiktokIcon,
};
document.querySelectorAll<HTMLElement>('[data-icon]').forEach((el) => {
  const icon = ICONS[el.dataset.icon ?? ''];
  if (icon) el.insertAdjacentHTML('afterbegin', icon);
});

/* ============ LANGUAGE SWITCH ============ */
// Remember the visitor's deliberate choice so the inline redirect script in
// <head> can send them straight to it on their next visit.
document.querySelectorAll<HTMLElement>('[data-lang-switch]').forEach((el) => {
  el.addEventListener('click', () => {
    try {
      localStorage.setItem('embah:lang', el.dataset.langSwitch ?? '');
    } catch {
      // localStorage unavailable (private browsing, etc.) - navigation still works.
    }
  });
});

/* ============ BACKGROUND MUSIC ============ */
// Browsers block autoplay-with-sound on a first visit with no prior user
// gesture/engagement, so we try unmuted first and fall back to a muted
// state until the visitor's first tap/click/key press anywhere on the page,
// which is when we actually start (unmuted) playback for real.
//
// iOS Safari also silently ignores HTMLMediaElement.volume - the element
// always plays back at full hardware volume no matter what we set it to -
// so loudness has to be controlled with a Web Audio GainNode instead, which
// iOS does honor.
const bgMusic = document.getElementById('bgMusic') as HTMLAudioElement | null;
const musicToggles = document.querySelectorAll<HTMLButtonElement>('[data-music-toggle]');
if (bgMusic && musicToggles.length) {
  bgMusic.src = bgMusicUrl;
  bgMusic.playbackRate = 0.9; // slightly slower than the source recording - tweak this number to taste

  const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  let audioCtx: AudioContext | null = null;
  if (AudioContextCtor) {
    audioCtx = new AudioContextCtor();
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.15; // 0 (silent) to 1 (full volume) - tweak this number to taste
    audioCtx.createMediaElementSource(bgMusic).connect(gainNode).connect(audioCtx.destination);
  } else {
    bgMusic.volume = 0.15; // fallback for the rare browser without Web Audio API support
  }

  const isBm = location.pathname.includes('/bm/');
  const actionLabel = (isMuted: boolean) =>
    isMuted
      ? (isBm ? 'Mainkan muzik latar' : 'Play background music')
      : (isBm ? 'Senyapkan muzik latar' : 'Mute background music');

  const syncToggles = (isMuted: boolean) => {
    musicToggles.forEach((btn) => {
      btn.classList.toggle('is-muted', isMuted);
      btn.setAttribute('aria-pressed', String(!isMuted));
      btn.setAttribute('aria-label', actionLabel(isMuted));
    });
  };

  // Tracks whether sound is actually audible right now. This is deliberately
  // separate from bgMusic.muted: a blocked/rejected play() call still leaves
  // .muted at whatever we last set it to, even though nothing is playing, so
  // reading .muted back would tell the toggle button the wrong current state.
  let isMuted = true;

  // Resuming audioCtx and calling bgMusic.play() must both fire synchronously
  // in the same tick a gesture handler runs in - awaiting one before calling
  // the other risks Safari treating the second call as no longer
  // gesture-triggered, and silently producing no audible output. The one-frame
  // silent buffer additionally forces iOS to fully wake its audio hardware,
  // which resume() alone doesn't always do.
  const unlockAudioContext = () => {
    if (!audioCtx) return;
    void audioCtx.resume();
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
  };

  const tryPlay = (muted: boolean) => {
    unlockAudioContext();
    bgMusic.muted = muted;
    return bgMusic.play().then(
      () => { isMuted = muted; syncToggles(muted); return true; },
      () => false
    );
  };

  tryPlay(false).then((started) => {
    if (started) return;
    // True unmuted autoplay is blocked without a user gesture (this is a
    // hard platform restriction, especially on iOS), so arm a one-time
    // listener that starts real playback on the visitor's very first
    // interaction anywhere on the page - sound plays by default rather
    // than requiring them to find the dedicated toggle button first.
    // Deliberately leave the toggle showing its default "sound on" icon
    // (see index.html) in the meantime instead of flipping it to muted -
    // the visitor should never see a state implying we chose to mute them.
    //
    // Listen on click/touchend/keyup specifically, not pointerdown/keydown -
    // browsers only treat the "release" events as genuine user activation for
    // granting audio permissions, so arming this on the "press" events instead
    // fires the handler without actually unlocking anything on stricter engines.
    //
    // touchend also fires at the end of a scroll/swipe, not just a tap, but a
    // scroll-ending touch doesn't necessarily carry real audio permission from
    // the browser - so don't disarm until a tryPlay attempt actually succeeds,
    // otherwise a scroll can burn the listener and leave nothing armed for the
    // visitor's next real tap.
    const startOnFirstGesture = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest('[data-music-toggle]')) return;
      tryPlay(false).then((played) => {
        if (!played) return;
        document.removeEventListener('click', startOnFirstGesture);
        document.removeEventListener('touchend', startOnFirstGesture);
        document.removeEventListener('keyup', startOnFirstGesture);
      });
    };
    document.addEventListener('click', startOnFirstGesture);
    document.addEventListener('touchend', startOnFirstGesture);
    document.addEventListener('keyup', startOnFirstGesture);
  });

  musicToggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      tryPlay(!isMuted);
    });
  });
}

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
if (feedbackSlides.length > 1) {
  const feedbackSlider = document.querySelector<HTMLElement>('.feedback-slider')!;
  const feedbackTrack = document.querySelector<HTMLElement>('.feedback-track')!;
  const realCount = feedbackSlides.length;
  const totalPositions = realCount + 2;

  // Clone the first/last slide onto the opposite ends of the strip so dragging
  // past an edge reveals a real-looking neighbor instead of cutting to blank
  // space. The clone is swapped for the true slide (invisibly) once it settles.
  const firstClone = feedbackSlides[0].cloneNode(true) as HTMLElement;
  const lastClone = feedbackSlides[realCount - 1].cloneNode(true) as HTMLElement;
  firstClone.setAttribute('aria-hidden', 'true');
  lastClone.setAttribute('aria-hidden', 'true');
  feedbackTrack.insertBefore(lastClone, feedbackSlides[0]);
  feedbackTrack.appendChild(firstClone);

  let activeIndex = Math.max(
    feedbackSlides.findIndex((slide) => slide.classList.contains('is-active')),
    0
  );
  let posIndex = activeIndex + 1;
  let timer: number;
  let slideWidth = feedbackTrack.clientWidth;

  const setTransform = (pos: number, offsetPx = 0, animate = true) => {
    if (!animate) feedbackTrack.classList.add('is-dragging');
    feedbackTrack.style.transform = `translateX(${-pos * slideWidth + offsetPx}px)`;
    if (!animate) {
      void feedbackTrack.offsetWidth;
      feedbackTrack.classList.remove('is-dragging');
    }
  };

  const setActive = (index: number) => {
    feedbackSlides[activeIndex]?.classList.remove('is-active');
    feedbackSlides[activeIndex]?.setAttribute('aria-hidden', 'true');
    feedbackDots[activeIndex]?.classList.remove('is-active');
    activeIndex = index;
    feedbackSlides[activeIndex]?.classList.add('is-active');
    feedbackSlides[activeIndex]?.setAttribute('aria-hidden', 'false');
    feedbackDots[activeIndex]?.classList.add('is-active');
  };

  // After a snap lands on a cloned end slot, jump the real position across
  // instantly (clone and the real slide are pixel-identical, so it's invisible).
  const normalizePos = () => {
    if (posIndex === 0) {
      posIndex = realCount;
      setTransform(posIndex, 0, false);
    } else if (posIndex === realCount + 1) {
      posIndex = 1;
      setTransform(posIndex, 0, false);
    }
  };

  feedbackTrack.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'transform') return;
    normalizePos();
  });

  const goToSlide = (index: number) => {
    // A backgrounded/throttled tab can drop the transitionend event above,
    // leaving posIndex parked on a clone slot. Re-check here so the very next
    // step self-corrects instead of drifting further out of bounds (which
    // would push the track past the last real slide into blank space).
    normalizePos();

    const nextIndex = (index + realCount) % realCount;
    if (nextIndex === activeIndex) return;

    // Adjacent steps (what autoplay always does, and most dot clicks) keep
    // rolling continuously through the clone on wraparound instead of
    // jumping backward across the whole strip. Non-adjacent dot jumps just
    // go straight there.
    const isNextStep = nextIndex === (activeIndex + 1) % realCount;
    const isPrevStep = nextIndex === (activeIndex - 1 + realCount) % realCount;

    setActive(nextIndex);

    if (isNextStep) posIndex += 1;
    else if (isPrevStep) posIndex -= 1;
    else posIndex = activeIndex + 1;

    setTransform(posIndex);
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

  feedbackSlider.addEventListener('mouseenter', () => window.clearInterval(timer));
  feedbackSlider.addEventListener('mouseleave', startAutoplay);

  window.addEventListener('resize', () => {
    slideWidth = feedbackTrack.clientWidth;
    if (!isDragging) setTransform(posIndex, 0, false);
  });

  let dragStartX = 0;
  let dragDeltaX = 0;
  let isDragging = false;
  const maxEdgeOvershoot = 60;

  const dampenEdge = (delta: number) => {
    const sign = Math.sign(delta);
    const abs = Math.abs(delta);
    return sign * maxEdgeOvershoot * (1 - Math.exp(-abs / maxEdgeOvershoot));
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

    const baseX = -posIndex * slideWidth;
    const minX = -(totalPositions - 1) * slideWidth;
    const maxX = 0;
    let x = baseX + dragDeltaX;
    if (x > maxX) x = maxX + dampenEdge(x - maxX);
    else if (x < minX) x = minX + dampenEdge(x - minX);

    feedbackTrack.style.transform = `translateX(${x}px)`;

    // Keep the dots (and aria-hidden state) synced live with whichever slide
    // is currently nearest to center, instead of only updating on release.
    const liveStep = Math.round(-dragDeltaX / slideWidth);
    const livePos = Math.min(totalPositions - 1, Math.max(0, posIndex + liveStep));
    const liveRealIndex = ((livePos - 1) + realCount) % realCount;
    if (liveRealIndex !== activeIndex) setActive(liveRealIndex);
  };

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    feedbackTrack.classList.remove('is-dragging');

    const rawSteps = Math.round(-dragDeltaX / slideWidth);
    posIndex = Math.min(totalPositions - 1, Math.max(0, posIndex + rawSteps));
    setTransform(posIndex);

    const realEquivIndex = ((posIndex - 1) + realCount) % realCount;
    if (realEquivIndex !== activeIndex) setActive(realEquivIndex);

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

  setTransform(posIndex, 0, false);
  startAutoplay();
}

/* ============ REFRESH ON LOAD (fonts / images can shift layout) ============ */
window.addEventListener('load', () => ScrollTrigger.refresh());
