// SCROLLING
// Initialize Lenis
const lenis = new Lenis({
  autoRaf: true,
});

// Listen for the scroll event and log the event data
lenis.on('scroll', (e) => {
  console.log(e);
});

// ── CURSOR ──
const dot = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');
let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX; mouseY = e.clientY;
  dot.style.left = mouseX + 'px';
  dot.style.top = mouseY + 'px';
});
function animateRing() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  ring.style.left = ringX + 'px';
  ring.style.top = ringY + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

document.querySelectorAll('a, button, .project-item, .skill-card, .stat-cell').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
});
document.addEventListener('mousedown', () => document.body.classList.add('clicking'));
document.addEventListener('mouseup', () => document.body.classList.remove('clicking'));

// ── CANVAS BACKGROUND ──
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [], trails = [];
let cx = window.innerWidth / 2, cy = window.innerHeight / 2;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => { cx = e.clientX; cy = e.clientY; });

// Floating particles
class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = (Math.random() - 0.5) * 0.3;
    this.size = Math.random() * 1.5 + 0.3;
    this.alpha = Math.random() * 0.4 + 0.05;
    this.color = Math.random() > 0.7 ? '#c1440e' : '#2a6496';
    this.pulse = Math.random() * Math.PI * 2;
    this.pulseSpeed = 0.01 + Math.random() * 0.02;
  }
  update() {
    this.pulse += this.pulseSpeed;
    const dx = cx - this.x, dy = cy - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const force = Math.max(0, (200 - dist) / 200);
    this.vx += (dx / dist) * force * 0.04;
    this.vy += (dy / dist) * force * 0.04;
    this.vx *= 0.97; this.vy *= 0.97;
    this.x += this.vx; this.y += this.vy;
    if (this.x < -10) this.x = W + 10;
    if (this.x > W + 10) this.x = -10;
    if (this.y < -10) this.y = H + 10;
    if (this.y > H + 10) this.y = -10;
  }
  draw() {
    const a = this.alpha * (0.6 + 0.4 * Math.sin(this.pulse));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color === '#c1440e' ? `rgba(26,86,219,${a})` : `rgba(14,154,193,${a})`;
    ctx.fill();
  }
}

// Connection lines
function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 100) {
        const alpha = (1 - dist / 100) * 0.06;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(26,86,219,${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

// Cursor trail
class Trail {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.alpha = 0.6;
    this.size = Math.random() * 3 + 1;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5 - 0.5;
  }
  update() {
    this.alpha -= 0.018;
    this.size *= 0.97;
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.02;
    this.vx *= 0.98;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(26,86,219,${this.alpha})`;
    ctx.fill();
  }
}

// Cursor glow
let prevCX = cx, prevCY = cy;
function drawCursorGlow() {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180);
  grad.addColorStop(0, 'rgba(26,86,219,0.07)');
  grad.addColorStop(0.4, 'rgba(26,86,219,0.025)');
  grad.addColorStop(1, 'rgba(26,86,219,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, 180, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

// Grid lines
function drawGrid() {
  const gridSize = 80;
  ctx.strokeStyle = 'rgba(0,0,0,0.04)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

for (let i = 0; i < 80; i++) particles.push(new Particle());

let lastTrailTime = 0;
function animate(ts) {
  ctx.fillStyle = 'rgba(245,242,236,0.18)';
  ctx.fillRect(0, 0, W, H);

  drawGrid();
  drawCursorGlow();

  // Add trails
  if (ts - lastTrailTime > 20 && Math.abs(cx - prevCX) + Math.abs(cy - prevCY) > 2) {
    trails.push(new Trail(cx, cy));
    lastTrailTime = ts;
    prevCX = cx; prevCY = cy;
  }

  trails = trails.filter(t => t.alpha > 0);
  trails.forEach(t => { t.update(); t.draw(); });

  particles.forEach(p => { p.update(); p.draw(); });
  drawConnections();

  requestAnimationFrame(animate);
}
animate(0);

// ── LOADER ──
(function () {
  const loader     = document.getElementById('loader');
  const bar        = document.getElementById('loaderBar');
  const numEl      = document.getElementById('loaderNum');
  const phaseEl    = document.getElementById('loaderPhase');
  const ringProg   = document.getElementById('ringProgress');
  const ringTxt    = document.getElementById('ringText');
  const lCanvas    = document.getElementById('loader-canvas');
  const lCtx       = lCanvas.getContext('2d');
  const ticksG     = document.getElementById('ringTicks');
  const linesWrap  = document.getElementById('loaderLines');
  const CIRCUM     = 251.2; // 2π×40

  // Draw tick marks around ring
  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * Math.PI * 2 - Math.PI / 2;
    const r1 = 46, r2 = 49;
    const x1 = 55 + Math.cos(angle) * r1;
    const y1 = 55 + Math.sin(angle) * r1;
    const x2 = 55 + Math.cos(angle) * r2;
    const y2 = 55 + Math.sin(angle) * r2;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'rgba(26,86,219,0.15)');
    line.setAttribute('stroke-width', i % 9 === 0 ? '2' : '1');
    ticksG.appendChild(line);
  }

  // Horizontal bg lines
  const lineCount = 12;
  for (let i = 0; i <= lineCount; i++) {
    const s = document.createElement('span');
    s.style.top = (i / lineCount * 100) + '%';
    linesWrap.appendChild(s);
  }

  // Loader canvas particles
  lCanvas.width  = window.innerWidth;
  lCanvas.height = window.innerHeight;
  const lParts = Array.from({ length: 50 }, () => ({
    x: Math.random() * lCanvas.width,
    y: Math.random() * lCanvas.height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    size: Math.random() * 1.8 + 0.4,
    alpha: Math.random() * 0.3 + 0.05,
    hue: Math.random() > 0.5 ? '26,86,219' : '14,154,193',
    pulse: Math.random() * Math.PI * 2,
  }));

  let lRAF;
  function drawLoaderCanvas() {
    lCtx.clearRect(0, 0, lCanvas.width, lCanvas.height);
    lParts.forEach(p => {
      p.pulse += 0.02; p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = lCanvas.width;
      if (p.x > lCanvas.width) p.x = 0;
      if (p.y < 0) p.y = lCanvas.height;
      if (p.y > lCanvas.height) p.y = 0;
      const a = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse));
      lCtx.beginPath();
      lCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      lCtx.fillStyle = `rgba(${p.hue},${a})`;
      lCtx.fill();
    });
    lRAF = requestAnimationFrame(drawLoaderCanvas);
  }
  drawLoaderCanvas();

  // Phases
  const phases = [
    { label: 'Initializing',    end: 20 },
    { label: 'Loading Assets',  end: 55 },
    { label: 'Building Layout', end: 80 },
    { label: 'Almost Ready',    end: 95 },
    { label: 'Launching',       end: 100 },
  ];
  let progress = 0;
  let phaseIdx = 0;

  function setProgress(val) {
    progress = val;
    bar.style.width        = val + '%';
    numEl.textContent      = Math.round(val) + '%';
    ringTxt.textContent    = Math.round(val) + '%';
    ringProg.style.strokeDashoffset = CIRCUM - (CIRCUM * val / 100);

    // Update phase label
    for (let i = phases.length - 1; i >= 0; i--) {
      if (val >= (phases[i - 1]?.end ?? 0)) {
        if (phaseIdx !== i) { phaseEl.textContent = phases[i].label; phaseIdx = i; }
        break;
      }
    }
  }

  // Realistic-feeling eased progress
  let current = 0;
  const targets = [0, 18, 52, 78, 94, 100];
  const delays  = [0, 300, 500, 600, 700, 400]; // ms between checkpoints
  let tIdx = 1;

  function advanceTo(target, duration) {
    const start     = current;
    const startTime = performance.now();
    function step(now) {
      const t  = Math.min((now - startTime) / duration, 1);
      const eased = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
      current = start + (target - start) * eased;
      setProgress(current);
      if (t < 1) { requestAnimationFrame(step); }
      else {
        current = target;
        setProgress(target);
        tIdx++;
        if (tIdx < targets.length) {
          setTimeout(() => advanceTo(targets[tIdx], 600 + Math.random() * 400), delays[tIdx]);
        } else { finish(); }
      }
    }
    requestAnimationFrame(step);
  }
  setTimeout(() => advanceTo(targets[1], 500), delays[0]);

  function finish() {
    setTimeout(() => {
      cancelAnimationFrame(lRAF);
      loader.classList.add('wipe');
      setTimeout(() => {
        loader.classList.add('hide');
        document.body.classList.remove('loading');
        setTimeout(() => loader.remove(), 800);
      }, 550);
    }, 200);
  }
})();

// ── NAVBAR ──
const navbar      = document.getElementById('navbar');
const navProgress = document.getElementById('navProgress');
const pillBg      = document.getElementById('pillBg');
const navPill     = document.getElementById('navPill');
const pillLinks   = navPill.querySelectorAll('a[data-section]');
const hamburger   = document.getElementById('hamburger');
const navDrawer   = document.getElementById('navDrawer');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const docH    = document.documentElement.scrollHeight - window.innerHeight;
  navProgress.style.width = (docH > 0 ? scrollY / docH * 100 : 0) + '%';
  navbar.classList.toggle('scrolled', scrollY > 40);
  updateActiveLink();
});

function updateActiveLink() {
  const sections = ['about','skills','projects','contact'];
  let current = '';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= 120) current = id;
  });
  pillLinks.forEach(a => {
    const active = a.dataset.section === current;
    a.classList.toggle('active', active);
    if (active) movePillBg(a);
  });
  pillBg.style.opacity = current ? '1' : '0';
}

function movePillBg(el) {
  const pRect = navPill.getBoundingClientRect();
  const eRect = el.getBoundingClientRect();
  pillBg.style.left    = (eRect.left - pRect.left) + 'px';
  pillBg.style.width   = eRect.width + 'px';
  pillBg.style.opacity = '1';
}

pillLinks.forEach(a => a.addEventListener('mouseenter', () => {
  // active pill tracking only — CSS handles the fill animation
  if (!a.classList.contains('active')) return;
  movePillBg(a);
}));

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navDrawer.classList.toggle('open');
  document.body.style.overflow = navDrawer.classList.contains('open') ? 'hidden' : '';
});
function closeDrawer() {
  hamburger.classList.remove('open');
  navDrawer.classList.remove('open');
  document.body.style.overflow = '';
}
setTimeout(updateActiveLink, 200);

const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });
reveals.forEach(r => observer.observe(r));

// ── COUNTER ANIMATION ──
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.textContent);
    if (isNaN(target)) return;
    let current = 0;
    const suffix = el.textContent.replace(/[0-9]/g, '');
    const step = Math.max(1, Math.floor(target / 40));
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current + suffix;
      if (current >= target) clearInterval(interval);
    }, 30);
  });
}
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounters(); statsObserver.disconnect(); } });
}, { threshold: 0.5 });
const statsEl = document.querySelector('.about-stats');
if (statsEl) statsObserver.observe(statsEl);