// Kropkowany globus (rzut ortograficzny) na canvasie. Bardzo wolny obrót, pauza poza ekranem.
import data from './globe-data.js';

const DEG = Math.PI / 180;
const TILT = 18 * DEG;        // w centrum 18°N: widać Europę i Afrykę jak w projekcie
const START_LON = -62;        // centrum ~62°E: w widocznej lewej części globusa są Europa i Afryka
const SPEED = 0.9;            // stopnie na sekundę
const FRAME_MS = 1000 / 30;   // 30 kl./s wystarcza przy tak wolnym ruchu

function decode(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const raw = new Uint16Array(bytes.buffer);
  const n = raw.length / 2;
  const lon = new Float32Array(n), cosLat = new Float32Array(n), sinLat = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    lon[i] = (raw[2 * i] / 10 - 180) * DEG;
    const lat = (raw[2 * i + 1] / 10 - 90) * DEG;
    cosLat[i] = Math.cos(lat);
    sinLat[i] = Math.sin(lat);
  }
  return { n, lon, cosLat, sinLat };
}

export function initGlobe(canvas, { reducedMotion }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const pts = decode(data);
  const cosT = Math.cos(TILT), sinT = Math.sin(TILT);
  let size = 0, dpr = 1, rot = START_LON * DEG, last = 0, raf = 0, visible = true;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = Math.max(1, Math.round(rect.width * dpr));
    canvas.width = canvas.height = size;
    draw();
  };

  function draw() {
    const r = size / 2 * 0.985;
    const c = size / 2;
    const dot = Math.max(1.2, size / 300);
    ctx.clearRect(0, 0, size, size);
    // Grupujemy po jasności, żeby ograniczyć zmiany stylu wypełnienia.
    const buckets = [[], [], [], []];
    for (let i = 0; i < pts.n; i++) {
      const l = pts.lon[i] + rot;
      const x0 = pts.cosLat[i] * Math.sin(l);
      const y0 = pts.sinLat[i];
      const z0 = pts.cosLat[i] * Math.cos(l);
      const y = y0 * cosT - z0 * sinT;
      const z = y0 * sinT + z0 * cosT;
      if (z <= 0.02) continue;
      // Światło z lewej-góry: jaśniej po lewej, ciemniej przy prawej krawędzi.
      const light = z * 0.75 + (-x0) * 0.35 + 0.1;
      const b = light > 0.85 ? 3 : light > 0.6 ? 2 : light > 0.35 ? 1 : 0;
      buckets[b].push(c + x0 * r, c - y * r);
    }
    const alphas = [0.3, 0.55, 0.8, 1];
    for (let b = 0; b < 4; b++) {
      ctx.fillStyle = `rgba(214, 230, 246, ${alphas[b]})`;
      const arr = buckets[b];
      for (let i = 0; i < arr.length; i += 2) ctx.fillRect(arr[i] - dot / 2, arr[i + 1] - dot / 2, dot, dot);
    }
  }

  const loop = (t) => {
    raf = 0;
    if (!visible || reducedMotion.matches) return;
    if (t - last >= FRAME_MS) {
      const dt = last ? Math.min(t - last, 100) : 0;
      last = t;
      rot += (SPEED * DEG * dt) / 1000;
      draw();
    }
    raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!raf && visible && !reducedMotion.matches) { last = 0; raf = requestAnimationFrame(loop); } };

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(canvas);
  reducedMotion.addEventListener?.('change', start);
  resize();
  start();
}
