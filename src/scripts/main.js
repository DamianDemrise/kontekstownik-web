// Punkt wejścia. Strona działa bez JS (linki to zwykłe <a>); skrypty obsługują zgodę/analitykę i ożywiają dekoracje.
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/scene.css';
import '../styles/hero.css';
import '../styles/cta.css';
import '../styles/social.css';
import '../styles/lang.css';
import '../styles/motion.css';
import '../styles/responsive.css';
import '../styles/consent.css';
import '../styles/materials.css';
import '../styles/brands.css';
import { initConsent } from './consent.js';
import { initNewPill } from './new-pill.js';
import { initMaterialsTools } from './materials-tools.js';
import { initTopicForms } from './topic-form.js';

initConsent();
initNewPill();
initMaterialsTools();
initTopicForms();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function startDecorations() {
  import('./globe.js').then(({ initGlobe }) => {
    const canvas = document.querySelector('.globe__dots');
    if (canvas) initGlobe(canvas, { reducedMotion });
  });
  import('./parallax.js').then(({ initParallax }) => initParallax({ reducedMotion }));
}

// Dekoracje dopiero po pierwszym renderze, żeby nie konkurowały z LCP.
if (document.readyState === 'complete') startDecorations();
else window.addEventListener('load', () => (window.requestIdleCallback || setTimeout)(startDecorations), { once: true });
