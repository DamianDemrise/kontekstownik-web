// Paralaksa paneli i globusa za kursorem. Tylko precyzyjny wskaźnik z hoverem, bez reduced motion.
export function initParallax({ reducedMotion }) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;

  const tick = () => {
    x += (tx - x) * 0.06;
    y += (ty - y) * 0.06;
    root.style.setProperty('--px', x.toFixed(3));
    root.style.setProperty('--py', y.toFixed(3));
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
  };

  const onMove = (e) => {
    if (!fine.matches || reducedMotion.matches) return;
    tx = (e.clientX / window.innerWidth) * 2 - 1;
    ty = (e.clientY / window.innerHeight) * 2 - 1;
    if (!raf) raf = requestAnimationFrame(tick);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
}
