// script.js
(function () {
  const stage = document.getElementById("stage");
  const DURATION = 5000; // ms (3 detik)
  let START_SIZE = 40;
  const SPAWN_INTERVAL = 1600; // ms per batch
  const OFFSET_OUT = -20; // start slightly outside viewport

  function checkViewport() {
    if (window.matchMedia("(max-width: 768px)").matches) {
      START_SIZE = 20;
    } else if (window.matchMedia("(max-width: 1024px)").matches) {
      console.log("Viewport ≤ 1024px");
      START_SIZE = 32;
    } else {
      console.log("Viewport > 1024px");
      START_SIZE = 40;
    }
  }

  checkViewport();

  // Jalankan lagi ketika viewport berubah
  window.addEventListener("resize", checkViewport);

  // Hitung 4 titik merata sepanjang tepi (0 .. width)
  function getEdgePositions(count, edge) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const points = [];
    for (let i = 0; i < count; i++) {
      // distribusi inclusive: i/(count-1) sehingga 0..1 inclusive (pojok tepat tercapai)
      const t = count === 1 ? 0.5 : i / (count - 1);
      const x = Math.round(t * w);
      let y;
      if (edge === "top") y = -OFFSET_OUT;
      else if (edge === "bottom") y = h + OFFSET_OUT;
      else if (edge === "left") x = -OFFSET_OUT;
      points.push({ x, y });
    }
    return points;
  }

  // center target di-offset
  function targetOffset(startX, startY) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const dx = centerX - startX;
    const dy = centerY - startY;
    const factor = 0.8; // berhenti di 80% perjalanan
    return {
      x: startX + dx * factor,
      y: startY + dy * factor,
    };
  }

  // buat elemen particle dan jalankan animasi manual (interpolasi)
  function spawnParticle(startX, startY, duration = DURATION) {
    const el = document.createElement("div");
    el.className = "particle";
    el.style.left = `${startX - START_SIZE / 2}px`;
    el.style.top = `${startY - START_SIZE / 2}px`;
    el.style.width = `${START_SIZE}px`;
    el.style.height = `${START_SIZE}px`;
    el.style.opacity = "1";
    el.style.backgroundColor = "#DE1B0A"; // awal merah
    stage.appendChild(el);

    const tgt = targetOffset(startX, startY);
    const startTime = performance.now();
    const startSize = START_SIZE;

    function tick(now) {
      const t = Math.min(1, (now - startTime) / duration); // 0..1
      const progress = t;

      // posisi linear menuju center
      const curX = startX + (tgt.x - startX) * progress;
      const curY = startY + (tgt.y - startY) * progress;

      // ukuran turun ke 0
      const curSize = Math.max(0, startSize * (1 - progress));

      // opacity: fade-in cepat lalu fade-out
      let curOpacity;
      const fadeInPortion = 0.5; // hanya 10% durasi buat fade-in
      if (t < fadeInPortion) {
        // pakai easing supaya lebih “cepat naik”
        (curOpacity = t / fadeInPortion), 0.5;
      } else {
        curOpacity = 1 - (t - fadeInPortion) / (1 - fadeInPortion);
      }
      curOpacity = Math.max(0, Math.min(1, curOpacity));

      // warna dari merah (#DE1B0A) → putih (#FFFFFF)
      const r = Math.round(222 + (255 - 222) * progress);
      const g = Math.round(27 + (255 - 27) * progress);
      const b = Math.round(10 + (255 - 10) * progress);
      const curColor = `rgb(${r}, ${g}, ${b})`;

      // apply style
      el.style.left = `${curX - curSize / 2}px`;
      el.style.top = `${curY - curSize / 2}px`;
      el.style.width = `${curSize}px`;
      el.style.height = `${curSize}px`;
      el.style.opacity = `${curOpacity}`;
      el.style.backgroundColor = curColor;

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        el.remove();
      }
    }

    requestAnimationFrame(tick);
  }

  // spawn satu batch: 4 di atas + 4 di bawah (equally spaced along top/bottom)
  function spawnBatch() {
    const topPts = getEdgePositions(4, "top"); // x: 0, 1/3W, 2/3W, W
    const bottomPts = getEdgePositions(4, "bottom");
    // spawn all simultaneously
    topPts.forEach((p) => spawnParticle(p.x, p.y));
    bottomPts.forEach((p) => spawnParticle(p.x, p.y));
  }

  // start looping spawn
  let intervalId = null;
  function startLoop() {
    if (intervalId) return;
    spawnBatch(); // spawn first immediately
    intervalId = setInterval(spawnBatch, SPAWN_INTERVAL);
  }

  // stop if needed
  function stopLoop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // adapt to resize — optional: ensure center tracked correctly
  window.addEventListener("resize", () => {
    // nothing to update for already running particles (they track center at time of spawn),
    // but that's acceptable. If you want dynamic tracking, you'd need to store refs per particle.
  });

  // start
  startLoop();

  // expose for debug if needed
  window._particlesAPI = { start: startLoop, stop: stopLoop, spawnBatch };
})();

// canvas particle

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
let particleCount;

function updateParticleCount() {
  const width = window.innerWidth;

  if (width <= 576) {
    particleCount = 20;
  } else if (width <= 1024) {
    particleCount = 30;
  } else {
    particleCount = 40;
  }
}
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

updateParticleCount();
window.addEventListener("resize", updateParticleCount);

for (let i = 0; i < particleCount; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 3 + 1,
    dx: (Math.random() - 0.5) * 1, // pergerakan horizontal lambat
    dy: (Math.random() - 0.5) * 0.3, // pergerakan vertikal lambat
    opacity: Math.random() * 0.5 + 0.3, // efek transparan
  });
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(134, 23, 23, ${p.opacity})`;
    ctx.fill();

    p.x += p.dx;
    p.y += p.dy;

    // jika keluar layar, balik arah
    if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
  });
  requestAnimationFrame(animate);
}

animate();
