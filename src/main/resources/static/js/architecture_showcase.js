/**
 * Living Architectural Canvas 3D Showcase - Nook & Key
 * Interactive, high-performance HTML5 Canvas luxury architecture visualizer
 */
(function() {
  const canvas = document.getElementById("architectureCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const container = document.querySelector(".cinematic-container");

  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;

  // Animation & Camera State
  let isRotating = true;
  let currentMode = "sunset"; // 'sunset' | 'twilight' | 'blueprint'
  let projectionMode = "perspective"; // 'perspective' | 'isometric'

  let angleY = 0.55;
  let angleX = 0.38;
  let targetAngleY = 0.55;
  let targetAngleX = 0.38;
  let zoom = 1.0;
  let targetZoom = 1.0;

  let isDragging = false;
  let startX = 0;
  let startY = 0;

  // Color Palettes
  const themes = {
    sunset: {
      bgTop: "#091c1e",
      bgBottom: "#13282a",
      grid: "rgba(232, 120, 90, 0.12)",
      line: "rgba(255, 230, 210, 0.4)",
      accent: "#e8785a",
      windowGlow: "rgba(253, 186, 116, 0.55)",
      windowEdge: "#fb923c",
      slabFill: "rgba(24, 49, 52, 0.85)",
      slabEdge: "rgba(240, 160, 130, 0.45)",
      poolFill: "rgba(20, 184, 166, 0.45)",
      poolEdge: "rgba(94, 234, 212, 0.8)",
      particleColor: "rgba(254, 215, 170, ",
      wireframeOnly: false
    },
    twilight: {
      bgTop: "#080e1e",
      bgBottom: "#0e1a38",
      grid: "rgba(56, 189, 248, 0.12)",
      line: "rgba(186, 230, 253, 0.45)",
      accent: "#38bdf8",
      windowGlow: "rgba(125, 211, 252, 0.5)",
      windowEdge: "#38bdf8",
      slabFill: "rgba(15, 29, 64, 0.9)",
      slabEdge: "rgba(125, 211, 252, 0.4)",
      poolFill: "rgba(6, 182, 212, 0.5)",
      poolEdge: "rgba(103, 232, 249, 0.9)",
      particleColor: "rgba(186, 230, 253, ",
      wireframeOnly: false
    },
    blueprint: {
      bgTop: "#030a16",
      bgBottom: "#051329",
      grid: "rgba(14, 165, 233, 0.25)",
      line: "rgba(56, 189, 248, 0.8)",
      accent: "#0ea5e9",
      windowGlow: "rgba(14, 165, 233, 0.2)",
      windowEdge: "#38bdf8",
      slabFill: "rgba(6, 30, 66, 0.35)",
      slabEdge: "rgba(56, 189, 248, 0.85)",
      poolFill: "rgba(14, 165, 233, 0.15)",
      poolEdge: "rgba(56, 189, 248, 0.9)",
      particleColor: "rgba(56, 189, 248, ",
      wireframeOnly: true
    }
  };

  // Particles
  const particles = [];
  const PARTICLE_COUNT = 45;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 600,
      y: (Math.random() - 0.5) * 350,
      z: (Math.random() - 0.5) * 600,
      radius: Math.random() * 2 + 0.8,
      speedY: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.7 + 0.2,
      pulse: Math.random() * Math.PI * 2
    });
  }

  // Resize handler
  function resize() {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }
  window.addEventListener("resize", resize);
  resize();

  // 3D Point Projection Helper
  function project(p, cx, cy) {
    // Rotation around Y
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const x1 = p.x * cosY + p.z * sinY;
    const z1 = -p.x * sinY + p.z * cosY;

    // Rotation around X
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    const y2 = p.y * cosX - z1 * sinX;
    const z2 = p.y * sinX + z1 * cosX;

    const scale = (projectionMode === "perspective") ? (700 / (700 + z2)) * zoom : 0.85 * zoom;
    return {
      x: cx + x1 * scale,
      y: cy + y2 * scale,
      z: z2,
      scale: scale
    };
  }

  // Draw 3D Box helper
  function drawBox(box, cx, cy, theme) {
    const { x, y, z, w, h, d, type } = box;
    const hw = w / 2;
    const hd = d / 2;

    const v = [
      { x: x - hw, y: y, z: z - hd },     // 0: top-back-left
      { x: x + hw, y: y, z: z - hd },     // 1: top-back-right
      { x: x + hw, y: y, z: z + hd },     // 2: top-front-right
      { x: x - hw, y: y, z: z + hd },     // 3: top-front-left
      { x: x - hw, y: y + h, z: z - hd }, // 4: bot-back-left
      { x: x + hw, y: y + h, z: z - hd }, // 5: bot-back-right
      { x: x + hw, y: y + h, z: z + hd }, // 6: bot-front-right
      { x: x - hw, y: y + h, z: z + hd }  // 7: bot-front-left
    ];

    const pv = v.map(pt => project(pt, cx, cy));

    // Faces: indices, normal indicator for shading
    const faces = [
      { pts: [0, 1, 2, 3], shade: 1.1, isTop: true },   // Top
      { pts: [3, 2, 6, 7], shade: 0.9, isFront: true }, // Front
      { pts: [1, 5, 6, 2], shade: 0.8, isRight: true }, // Right
      { pts: [0, 4, 7, 3], shade: 0.7, isLeft: true },  // Left
      { pts: [4, 5, 1, 0], shade: 0.6, isBack: true },  // Back
      { pts: [7, 6, 5, 4], shade: 0.5, isBot: true }    // Bottom
    ];

    faces.forEach(face => {
      const p0 = pv[face.pts[0]];
      const p1 = pv[face.pts[1]];
      const p2 = pv[face.pts[2]];
      const p3 = pv[face.pts[3]];

      // Cross product for back-face culling
      const cross = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x);
      if (cross <= 0 && !theme.wireframeOnly) return;

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();

      if (type === "glass") {
        ctx.fillStyle = theme.windowGlow;
        ctx.strokeStyle = theme.windowEdge;
        ctx.lineWidth = 1.2;
        ctx.fill();
        ctx.stroke();

        // Architectural mullions/grids
        if (!theme.wireframeOnly && (face.isFront || face.isRight)) {
          ctx.beginPath();
          const mx = (p0.x + p1.x + p2.x + p3.x) / 4;
          const my = (p0.y + p1.y + p2.y + p3.y) / 4;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
          ctx.lineWidth = 0.8;
          ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
          ctx.lineTo((p3.x + p2.x) / 2, (p3.y + p2.y) / 2);
          ctx.stroke();
        }
      } else if (type === "pool") {
        ctx.fillStyle = theme.poolFill;
        ctx.strokeStyle = theme.poolEdge;
        ctx.lineWidth = 1.4;
        ctx.fill();
        ctx.stroke();

        // Shimmering water ripples
        if (face.isTop) {
          const t = Date.now() * 0.003;
          ctx.beginPath();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 1;
          for (let r = 0; r < 3; r++) {
            const rx = p0.x + (p2.x - p0.x) * (0.3 + 0.2 * r) + Math.sin(t + r) * 6;
            const ry = p0.y + (p2.y - p0.y) * (0.3 + 0.2 * r) + Math.cos(t + r) * 3;
            ctx.ellipse(rx, ry, 16 + r * 4, 6 + r * 2, 0, 0, Math.PI * 2);
          }
          ctx.stroke();
        }
      } else {
        // Concrete Slab / Stone Wall
        ctx.fillStyle = theme.slabFill;
        ctx.strokeStyle = theme.slabEdge;
        ctx.lineWidth = 1.2;
        ctx.fill();
        ctx.stroke();
      }
    });
  }

  // Draw Foundation Grid
  function drawGrid(cx, cy, theme) {
    const size = 320;
    const step = 40;
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;

    for (let i = -size; i <= size; i += step) {
      const p1 = project({ x: i, y: 120, z: -size }, cx, cy);
      const p2 = project({ x: i, y: 120, z: size }, cx, cy);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const p3 = project({ x: -size, y: 120, z: i }, cx, cy);
      const p4 = project({ x: size, y: 120, z: i }, cx, cy);
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.stroke();
    }

    if (currentMode === "blueprint") {
      // Blueprint Dimension Rings and coordinate lines
      ctx.strokeStyle = "rgba(14, 165, 233, 0.4)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const pC = project({ x: 0, y: 120, z: 0 }, cx, cy);
      ctx.ellipse(pC.x, pC.y, 220 * pC.scale, 110 * pC.scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Blueprint coordinate HUD
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(56, 189, 248, 0.7)";
      ctx.fillText("GRID_ELEVATION: +12.4m // ELEV: 45° ISO", 30, height - 30);
      ctx.fillText("LAT: 6.9271° N // LNG: 79.8612° E [COLOMBO]", 30, height - 16);
    }
  }

  // Architecture Models Layout
  const architecturalElements = [
    // Ground Base Podium (Landscape Terrace)
    { x: 0, y: 90, z: 0, w: 340, h: 30, d: 300, type: "podium" },
    
    // Infinity Plunge Pool
    { x: 90, y: 88, z: 40, w: 120, h: 4, d: 80, type: "pool" },

    // Level 1 Lower Living Pavilion (Cantilevered Glass + Frame)
    { x: -50, y: 30, z: -20, w: 190, h: 60, d: 150, type: "glass" },
    { x: -50, y: 25, z: -20, w: 200, h: 8, d: 160, type: "slab" },

    // Middle Overhang Balcony & Garden Terrace
    { x: 20, y: -25, z: 10, w: 180, h: 10, d: 170, type: "slab" },

    // Level 2 Penthouse Residence
    { x: 30, y: -80, z: 10, w: 160, h: 55, d: 140, type: "glass" },
    { x: 30, y: -85, z: 10, w: 170, h: 8, d: 150, type: "slab" },

    // Level 3 Floating Roof Cantilever & Timber Pergola
    { x: 20, y: -110, z: 15, w: 210, h: 6, d: 180, type: "slab" },
    
    // Vertical Architectural Column Spine
    { x: -110, y: -30, z: -50, w: 18, h: 145, d: 18, type: "slab" },
    { x: -40, y: 5, z: 90, w: 14, h: 85, d: 14, type: "slab" }
  ];

  // Main Render Loop
  let lastTime = performance.now();
  function render(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    // Smooth Camera Inertia
    if (isRotating && !isDragging) {
      targetAngleY += 0.0035;
    }
    angleY += (targetAngleY - angleY) * 0.08;
    angleX += (targetAngleX - angleX) * 0.08;
    zoom += (targetZoom - zoom) * 0.08;

    const theme = themes[currentMode] || themes.sunset;

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, theme.bgTop);
    bgGrad.addColorStop(1, theme.bgBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2 + 30;

    // Draw Grid Foundation
    drawGrid(cx, cy, theme);

    // Sort 3D boxes by depth (Painter's algorithm)
    const sorted = [...architecturalElements].sort((a, b) => {
      const az = -a.x * Math.sin(angleY) + a.z * Math.cos(angleY);
      const bz = -b.x * Math.sin(angleY) + b.z * Math.cos(angleY);
      return az - bz;
    });

    sorted.forEach(box => {
      drawBox(box, cx, cy, theme);
    });

    // Draw Floating Light Particles
    particles.forEach(p => {
      p.y += p.speedY;
      p.pulse += 0.04;
      if (p.y < -220) p.y = 120;

      const pp = project(p, cx, cy);
      if (pp.z > -400) {
        const alpha = Math.max(0, Math.min(1, p.alpha * (0.7 + 0.3 * Math.sin(p.pulse))));
        ctx.beginPath();
        ctx.fillStyle = theme.particleColor + alpha + ")";
        ctx.arc(pp.x, pp.y, p.radius * pp.scale, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  // Mouse & Touch Parallax Tracking
  if (container) {
    container.addEventListener("mousemove", (e) => {
      if (isDragging) return;
      const rect = container.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      targetAngleX = 0.38 + normY * 0.35;
      if (!isRotating) {
        targetAngleY = 0.55 + normX * 0.7;
      }
    });

    // Mouse drag orbit
    container.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      startX = e.clientX;
      startY = e.clientY;

      targetAngleY += dx * 0.007;
      targetAngleX = Math.max(0.1, Math.min(0.85, targetAngleX + dy * 0.007));
    });

    // Mobile Touch
    container.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });

    container.addEventListener("touchmove", (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;

      targetAngleY += dx * 0.008;
      targetAngleX = Math.max(0.1, Math.min(0.85, targetAngleX + dy * 0.008));
    }, { passive: true });

    container.addEventListener("touchend", () => {
      isDragging = false;
    });
  }

  // Play / Pause Motion Control
  const playBtn = document.getElementById("cinematicPlayBtn");
  const playIcon = document.getElementById("playIcon");
  const playLabel = document.getElementById("playLabel");

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      isRotating = !isRotating;
      if (isRotating) {
        if (playIcon) playIcon.textContent = "⏸";
        if (playLabel) playLabel.textContent = window.t ? window.t("cinematic_btn_pause", "Pause Motion") : "Pause Motion";
      } else {
        if (playIcon) playIcon.textContent = "▶";
        if (playLabel) playLabel.textContent = window.t ? window.t("cinematic_btn_play", "Play Motion") : "Play Motion";
      }
    });
  }

  // Perspective Mode Toggle
  const modeBtn = document.getElementById("cinematicModeBtn");
  const modeLabel = document.getElementById("modeLabel");

  if (modeBtn) {
    modeBtn.addEventListener("click", () => {
      if (projectionMode === "perspective") {
        projectionMode = "isometric";
        if (modeLabel) modeLabel.textContent = "Perspective 3D";
      } else {
        projectionMode = "perspective";
        if (modeLabel) modeLabel.textContent = "Isometric View";
      }
    });
  }

  // Story Pills Mode Switchers
  const pills = document.querySelectorAll(".story-pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const mode = pill.getAttribute("data-mode");
      if (mode && themes[mode]) {
        currentMode = mode;
      }
    });
  });

})();
