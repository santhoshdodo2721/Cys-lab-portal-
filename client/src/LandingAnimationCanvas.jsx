import React, { useEffect, useRef } from 'react';
import { translatedJsx } from './translation.jsx';
import { EMBLEM_POINTS } from './emblemData.js';

/**
 * LandingAnimationCanvas — 3D Rotating Cyber Dragon Morph Animation
 *
 * Sequence:
 * Phase 0: 3D Rotating cylindrical wave / cyber dragon in flight across screen (3.0s)
 * Phase 1: Rapid convergence — balls accelerate & snap into dragon logo (1.2s)
 * Phase 2: Formed Dragon Logo holds solid, breathes, pulses, and responds to cursor (10.0s)
 * Phase 3: Fast explosive dispersal / burst outwards before looping (1.0s)
 * Total cycle: ~15.2s (repeats continuously)
 */
export default function LandingAnimationCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth || 1200);
    let height = (canvas.height = window.innerHeight || 800);

    const mouse = { x: -9999, y: -9999, active: false };

    // Emblem image loaded for light transparency display during logo formation
    const emblemImg = new Image();
    emblemImg.src = '/incognitrix-emblem.png';
    let imgLoaded = false;
    emblemImg.onload = () => { imgLoaded = true; };

    // Phase timings (seconds): 3s 3D rotating wave, 1.2s converge, 10s logo hold, 1s disperse
    const PD = {
      rotatingWave: 3.0, // 3.0s dynamic 3D rotating dragon wave
      converge: 1.2,     // Rapid acceleration & snap into dragon logo
      logoHold: 10.0,    // Logo holds locked for 10 full seconds
      disperse: 1.0,     // Fast outward burst before looping
    };
    const TOTAL_CYCLE = PD.rotatingWave + PD.converge + PD.logoHold + PD.disperse;

    const PARTICLE_COUNT = EMBLEM_POINTS.length; // 1205 clean, spacious points

    // Build particle structures
    const NUM_STREAMS = 22;
    let particles = [];

    function buildParticles() {
      particles = new Array(PARTICLE_COUNT);
      const colsPerStream = Math.ceil(PARTICLE_COUNT / NUM_STREAMS);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const pt = EMBLEM_POINTS[i];
        const ex = pt[0]; // normalized X (0..1)
        const ey = pt[1]; // normalized Y (0..1)
        const type = pt[2]; // 0: red dragon/left shield, 1: white shield

        const streamIndex = i % NUM_STREAMS;
        const colIndex = Math.floor(i / NUM_STREAMS);

        const distFromCenter = Math.hypot(ex - 0.5, ey - 0.5);
        const angleFromCenter = Math.atan2(ey - 0.5, ex - 0.5);

        particles[i] = {
          id: i,
          type: type, // 0: red, 1: white
          ex: ex,
          ey: ey,
          distFromCenter: distFromCenter,
          angleFromCenter: angleFromCenter,
          // 3D Rotating dragon stream baseline
          baseY: ((streamIndex + 0.5) / NUM_STREAMS) * height + (Math.sin(colIndex) * 20),
          baseX: ((colIndex / colsPerStream) * width * 1.8) - width * 0.4,
          speed: width * 0.85 + (i % 9) * 70, // High-speed dynamic flight across viewport (px/s)
          wAmp: 42 + (i % 7) * 14,
          wFreq: 0.0035 + (i % 5) * 0.001,
          wPhase: (i * 0.19) % (Math.PI * 2),
          // Disperse scatter vector
          disperseAngle: angleFromCenter + ((i % 7) - 3) * 0.15,
          disperseDist: width * 0.45 + (i % 11) * 40,
          // Physical coordinates
          x: 0,
          y: 0,
          prevX: 0,
          prevY: 0,
          vx: 0,
          vy: 0,
          // Clean, spacious grain radius (Option B: distinct breathing room)
          radius: type === 0 ? 1.05 + (i % 3) * 0.12 : 0.95 + (i % 3) * 0.1,
        };
      }
    }

    // Floating embers around the formed logo
    const SPARK_COUNT = 40;
    let sparks = [];
    function buildSparks() {
      sparks = [];
      for (let s = 0; s < SPARK_COUNT; s++) {
        sparks.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vy: -(0.4 + Math.random() * 0.8),
          vx: (Math.random() - 0.5) * 0.5,
          size: 0.8 + Math.random() * 1.6,
          alpha: 0.2 + Math.random() * 0.5,
        });
      }
    }

    // Easing functions for high-speed dynamic feel
    function easeOutBack(t) {
      const c1 = 0.8;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    function easeInQuad(t) {
      return t * t;
    }

    function onResize() {
      width = canvas.width = window.innerWidth || 1200;
      height = canvas.height = window.innerHeight || 800;
      buildParticles();
      buildSparks();
    }

    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    }
    function onPointerLeave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);

    buildParticles();
    buildSparks();

    const startTime = performance.now();

    function render(now) {
      animId = requestAnimationFrame(render);
      const elapsed = (now - startTime) / 1000;
      const cycleTime = elapsed % TOTAL_CYCLE;

      // Phase calculation
      let phase = 0;
      let phaseProg = 0;
      let acc = 0;

      if (cycleTime < (acc += PD.rotatingWave)) {
        phase = 0; // 3.0s Rotating 3D Dragon Wave
        phaseProg = cycleTime / PD.rotatingWave;
      } else if (cycleTime < (acc += PD.converge)) {
        phase = 1; // 1.2s Fast converge into logo
        phaseProg = (cycleTime - (acc - PD.converge)) / PD.converge;
      } else if (cycleTime < (acc += PD.logoHold)) {
        phase = 2; // 10.0s Formed logo holds solid
        phaseProg = (cycleTime - (acc - PD.logoHold)) / PD.logoHold;
      } else {
        phase = 3; // 1.0s Disperse burst
        phaseProg = (cycleTime - acc) / PD.disperse;
      }

      ctx.clearRect(0, 0, width, height);

      // Determine logo center and target sizing
      let logoCenterX = width / 2;
      let logoCenterY = height * 0.35;
      let logoSize = Math.min(width * 0.92, height * 0.65, 520);

      const emblemEl = document.querySelector('.landing-emblem-container');
      if (emblemEl) {
        const er = emblemEl.getBoundingClientRect();
        const cr = canvas.getBoundingClientRect();
        if (er.width > 0 && er.height > 0) {
          logoCenterX = er.left + er.width / 2 - cr.left;
          logoCenterY = er.top + er.height / 2 - cr.top;
          logoSize = Math.min(er.width, er.height) * 0.98;
        }
      }

      const logoScale = Math.max(0.8, logoSize / 300);

      const logoLeft = logoCenterX - logoSize / 2;
      const logoTop = logoCenterY - logoSize / 2;

      // Deep atmospheric cyber nebula glow behind the dragon during formation & hold
      if (phase === 1 || phase === 2) {
        const glowFade = phase === 1 ? phaseProg : phase === 2 ? 1 : (1 - phaseProg);
        const pulse = (phase === 2) ? Math.sin(elapsed * 2.2) * 0.03 : 0;
        const bgGlow = ctx.createRadialGradient(logoCenterX, logoCenterY, 0, logoCenterX, logoCenterY, logoSize * 0.72);
        bgGlow.addColorStop(0, `rgba(184, 16, 40, ${(0.22 + pulse) * glowFade})`);
        bgGlow.addColorStop(0.38, `rgba(128, 10, 28, ${(0.10 + pulse) * glowFade})`);
        bgGlow.addColorStop(0.72, `rgba(255, 26, 60, ${(0.02) * glowFade})`);
        bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = bgGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // Lock-in shockwave ring right when the logo assembles
      if (phase === 1 && phaseProg > 0.8) {
        const shockT = (phaseProg - 0.8) / 0.2;
        const shockRadius = shockT * logoSize * 0.85;
        const shockAlpha = (1 - shockT) * 0.55;
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoCenterX, logoCenterY, shockRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 60, 75, ${shockAlpha})`;
        ctx.lineWidth = 2.5 * (1 - shockT);
        ctx.stroke();
        ctx.restore();
      }

      // Floating pedestal drop shadow beneath the emblem
      if (phase === 1 || phase === 2 || phase === 3) {
        const shadowFade = phase === 1 ? phaseProg : phase === 2 ? 1 : (1 - phaseProg);
        const breathOffset = (phase === 2) ? Math.sin(elapsed * 2.5) * 2 : 0;
        const shadowY = logoTop + logoSize * 0.98 + breathOffset * 0.4;
        const shadowRadiusX = logoSize * 0.35 + breathOffset * 1.2;
        const shadowRadiusY = logoSize * 0.045;

        ctx.save();
        const floorShadow = ctx.createRadialGradient(
          logoCenterX, shadowY, 0,
          logoCenterX, shadowY, shadowRadiusX
        );
        floorShadow.addColorStop(0, `rgba(0, 0, 0, ${0.85 * shadowFade})`);
        floorShadow.addColorStop(0.45, `rgba(15, 2, 5, ${0.45 * shadowFade})`);
        floorShadow.addColorStop(0.75, `rgba(160, 16, 32, ${0.08 * shadowFade})`);
        floorShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.ellipse(logoCenterX, shadowY, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
        ctx.fillStyle = floorShadow;
        ctx.fill();
        ctx.restore();
      }

      // When forming as a logo, display the emblem in a very light transparency with soft ambient drop shadow
      if (imgLoaded && (phase === 1 || phase === 2 || phase === 3)) {
        let imgAlpha = 0;
        if (phase === 1) {
          // Smoothly fades in in a very light transparency as particles assemble into the logo
          const formT = Math.max(0, (phaseProg - 0.25) / 0.75);
          imgAlpha = 0.15 * (formT * formT);
        } else if (phase === 2) {
          // Holds in a very light, subtle transparency (0.13 - 0.16) with gentle breathing
          imgAlpha = 0.14 + Math.sin(elapsed * 2.2) * 0.02;
        } else if (phase === 3) {
          // Fades out gracefully on outward dispersal burst
          imgAlpha = 0.14 * Math.max(0, 1 - phaseProg * 1.5);
        }

        if (imgAlpha > 0.005) {
          ctx.save();
          // Soft ambient drop shadow behind the transparent emblem
          ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
          ctx.shadowBlur = Math.round(16 * logoScale);
          ctx.shadowOffsetY = Math.round(8 * logoScale);
          ctx.shadowOffsetX = 0;
          ctx.globalAlpha = imgAlpha;
          ctx.drawImage(emblemImg, logoLeft, logoTop, logoSize, logoSize);
          ctx.restore();
        }
      }

      const redBalls = [];
      const whiteBalls = [];
      const speedTrails = [];

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];

        // 1. 3D Rotating Dragon Wave (Phase 0 - 3.0s)
        // Horizontal travel with speed
        const travelX = (p.baseX + elapsed * p.speed) % (width + 400) - 200;
        // Serpentine dragon spine undulating across the canvas
        const spineY = height * 0.40 + Math.sin(travelX * 0.0035 + elapsed * 3.5) * (height * 0.14);

        // 3D cylindrical rotation modulated by dragon body structure
        const rotAngle = elapsed * 4.2 + (travelX * 0.0055) + p.wPhase + (p.ex - 0.5) * 3.5;
        // Dragon body radius: thicker in the chest/wings, tapering towards head and tail
        const radiusY = p.wAmp * 2.2 + (1 - p.distFromCenter) * 40;
        const radiusX = radiusY * 0.65;
        const rotY = Math.sin(rotAngle) * radiusY;
        const rotX = Math.cos(rotAngle) * radiusX;
        const depthZ = Math.cos(rotAngle); // Depth scale in 3D: [-1 .. 1]

        // Combine spine with 3D rotation and morphological Y offset from the dragon emblem
        const waveX = travelX + rotX;
        const waveY = spineY + rotY + (p.ey - 0.5) * 60;

        // 2. Exact Logo Target Coordinates (Phase 2 - 10s hold)
        // Subtle micro-pulse breathing during the 10 second hold
        const breatheY = (phase === 2) ? Math.sin(elapsed * 2.5 + p.id * 0.004) * 1.5 : 0;
        const breatheX = (phase === 2) ? Math.cos(elapsed * 1.8 + p.id * 0.004) * 0.7 : 0;
        const targetLogoX = logoLeft + p.ex * logoSize + breatheX;
        const targetLogoY = logoTop + p.ey * logoSize + breatheY;

        let targetX = waveX;
        let targetY = waveY;

        if (phase === 0) {
          // 3s Rotating 3D Dragon Wave
          targetX = waveX;
          targetY = waveY;
        } else if (phase === 1) {
          // Rapid convergence into 2D logo
          const stagger = p.distFromCenter * 0.35;
          const localProg = Math.max(0, Math.min(1, (phaseProg - stagger) / (1 - stagger)));
          const eSnap = easeOutBack(localProg);
          targetX = waveX + (targetLogoX - waveX) * eSnap;
          targetY = waveY + (targetLogoY - waveY) * eSnap;
        } else if (phase === 2) {
          // 10s Formed logo hold
          targetX = targetLogoX;
          targetY = targetLogoY;
        } else {
          // Fast outward burst
          const eBurst = easeInQuad(phaseProg);
          targetX = targetLogoX + Math.cos(p.disperseAngle) * p.disperseDist * eBurst;
          targetY = targetLogoY + Math.sin(p.disperseAngle) * p.disperseDist * eBurst;
        }

        // Mouse repulsion physics
        let repelX = 0;
        let repelY = 0;
        if (mouse.active) {
          const mdx = targetX - mouse.x;
          const mdy = targetY - mouse.y;
          const dist = Math.hypot(mdx, mdy);
          if (dist < 90 && dist > 0) {
            const force = (90 - dist) / 90;
            repelX = (mdx / dist) * force * 28;
            repelY = (mdy / dist) * force * 28;
          }
        }

        // Fast responsive interpolation
        p.prevX = p.x;
        p.prevY = p.y;
        const lerpRate = phase === 1 ? 0.35 : phase === 0 ? 0.3 : 0.22;
        p.x += (targetX + repelX - p.x) * lerpRate;
        p.y += (targetY + repelY - p.y) * lerpRate;
        p.vx = p.x - p.prevX;
        p.vy = p.y - p.prevY;

        // Speed trail for fast balls in wave & burst phases
        if (phase === 0 || phase === 3 || (phase === 1 && phaseProg < 0.6)) {
          const spd = Math.hypot(p.vx, p.vy);
          if (spd > 2.5 && (i % 3 === 0)) {
            speedTrails.push({
              x1: p.x,
              y1: p.y,
              x2: p.x - p.vx * 1.5,
              y2: p.y - p.vy * 1.5,
              type: p.type,
            });
          }
        }

        // Dynamic phase & logo scaling: scale with logoSize to preserve perfect spaciousness
        const phaseScale = phase === 0 ? 1.4 : phase === 1 ? (1.4 - phaseProg * 0.4) : 1.0;
        const depthScale = phase === 0 ? (0.84 + (depthZ + 1) * 0.22) : 1.0;
        const shimmer = phase === 2 ? Math.sin(elapsed * 2.5 + p.distFromCenter * 6) * 0.05 : 0;
        const drawRadius = Math.max(0.8, p.radius * logoScale * phaseScale * depthScale * (1 + shimmer));

        // Store into batch drawing queues
        if (p.type === 0) {
          redBalls.push({ x: p.x, y: p.y, r: drawRadius });
        } else {
          whiteBalls.push({ x: p.x, y: p.y, r: drawRadius });
        }
      }

      // Draw speed trails for fast-moving balls
      if (speedTrails.length > 0) {
        ctx.lineWidth = 1.2 * logoScale;
        ctx.beginPath();
        for (let t = 0; t < speedTrails.length; t++) {
          const tr = speedTrails[t];
          ctx.moveTo(tr.x1, tr.y1);
          ctx.lineTo(tr.x2, tr.y2);
        }
        ctx.strokeStyle = phase === 3 ? 'rgba(255, 60, 80, 0.35)' : 'rgba(255, 45, 65, 0.4)';
        ctx.stroke();
      }

      // Draw Red Dragon & Shield Grains (clean, deep ruby with vibrant attractive cyber glow)
      if (redBalls.length > 0) {
        ctx.save();
        if (phase === 2) {
          // Pass 1: Radiant attractive crimson neon aura
          ctx.shadowBlur = Math.round(8 * logoScale);
          ctx.shadowColor = 'rgba(255, 25, 55, 0.75)';
          ctx.fillStyle = 'rgba(235, 20, 50, 0.45)';
          ctx.beginPath();
          for (let i = 0; i < redBalls.length; i++) {
            const b = redBalls[i];
            ctx.moveTo(b.x + b.r * 1.15, b.y);
            ctx.arc(b.x, b.y, b.r * 1.15, 0, Math.PI * 2);
          }
          ctx.fill();

          // Pass 2: Deep, rich, darker ruby crimson core
          ctx.shadowBlur = Math.round(3 * logoScale);
          ctx.shadowColor = 'rgba(255, 30, 60, 0.4)';
          ctx.fillStyle = '#c6122d';
          ctx.beginPath();
          for (let i = 0; i < redBalls.length; i++) {
            const b = redBalls[i];
            ctx.moveTo(b.x + b.r, b.y);
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          }
          ctx.fill();
        } else {
          ctx.fillStyle = '#b71c1c';
          ctx.beginPath();
          for (let i = 0; i < redBalls.length; i++) {
            const b = redBalls[i];
            ctx.moveTo(b.x + b.r, b.y);
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          }
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw White/Silver Crest Grains (sleek titanium with ethereal icy glow)
      if (whiteBalls.length > 0) {
        ctx.save();
        if (phase === 2) {
          // Pass 1: Soft ethereal halo
          ctx.shadowBlur = Math.round(6.5 * logoScale);
          ctx.shadowColor = 'rgba(180, 225, 250, 0.65)';
          ctx.fillStyle = 'rgba(165, 210, 235, 0.35)';
          ctx.beginPath();
          for (let i = 0; i < whiteBalls.length; i++) {
            const b = whiteBalls[i];
            ctx.moveTo(b.x + b.r * 1.15, b.y);
            ctx.arc(b.x, b.y, b.r * 1.15, 0, Math.PI * 2);
          }
          ctx.fill();

          // Pass 2: Sleek darker titanium platinum core
          ctx.shadowBlur = Math.round(2.5 * logoScale);
          ctx.shadowColor = 'rgba(200, 235, 255, 0.45)';
          ctx.fillStyle = '#a2b6c2';
          ctx.beginPath();
          for (let i = 0; i < whiteBalls.length; i++) {
            const b = whiteBalls[i];
            ctx.moveTo(b.x + b.r, b.y);
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          }
          ctx.fill();
        } else {
          ctx.fillStyle = '#90a4ae';
          ctx.beginPath();
          for (let i = 0; i < whiteBalls.length; i++) {
            const b = whiteBalls[i];
            ctx.moveTo(b.x + b.r, b.y);
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          }
          ctx.fill();
        }
        ctx.restore();
      }

      // Floating crimson dragon embers during logo hold
      if (phase === 2) {
        for (let s = 0; s < sparks.length; s++) {
          const sp = sparks[s];
          sp.y += sp.vy;
          sp.x += sp.vx + Math.sin(elapsed * 2.5 + s) * 0.3;

          if (sp.y < logoTop - 40 || sp.x < 0 || sp.x > width) {
            sp.x = logoLeft + Math.random() * logoSize;
            sp.y = logoTop + logoSize * 0.75 + Math.random() * (logoSize * 0.25);
          }

          ctx.fillStyle = `rgba(240, 35, 50, ${sp.alpha})`;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
    };
  }, []);

  return React.createElement('canvas', {
    ref: canvasRef,
    className: 'landing-animation-canvas',
    'aria-hidden': 'true',
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 0,
    },
  });
}
