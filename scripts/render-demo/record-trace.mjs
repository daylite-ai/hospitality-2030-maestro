#!/usr/bin/env node
/**
 * Record the deterministic 1:55 Maestro demo trace as a single WebM,
 * with /operator mobile view composited as an iframe PiP in the bottom-
 * right corner. Logs the wallclock time of every choreographed event so
 * ffmpeg can anchor each TTS audio line to its exact visual cue.
 *
 * Usage:
 *   node record-trace.mjs
 *
 * Output:
 *   out/trace.webm    — 1920×1080 silent video
 *   out/events.json   — { startedAt, events: [{name, t_ms}, ...] }
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "out");
fs.mkdirSync(OUT, { recursive: true });

// Choreography wallclock targets (ms from recording start). The narration
// is anchored to these visual events, not to the wallclock of the
// orchestrator's tool_completed events.
const TIMES = {
  fan_idle_settle: 3_000,    // just sit on idle dashboard
  hit_karp: 14_000,           // 0:14 — trigger Karp
  karp_window_end: 50_000,    // 0:50 — Karp scenario expected to be done
  hit_recovery: 51_000,       // 0:51 — trigger Recovery
  recovery_window_end: 78_000,// 1:18 — Recovery done
  hit_proactive: 80_000,      // 1:20 — trigger Proactive
  reveal_phone: 83_000,       // 1:23 — phone visible (PiP highlight)
  ack_press: 92_000,          // 1:32 — staff long-press completes
  proactive_done_window: 105_000, // 1:45 — Maestro proactive voice
  hold_close: 113_000,        // 1:53 — last beat
  end: 117_000,               // 1:57 — record stops
};

// Smooth cursor + global transitions per May-26 Reddit recipe.
const cursorScript = `
  (function () {
    const cursor = document.createElement('div');
    cursor.id = '__demo_cursor';
    cursor.style.cssText = 'position:fixed;width:22px;height:22px;border-radius:50%;background:rgba(26,23,19,0.42);border:2px solid rgba(255,255,255,0.9);box-shadow:0 1px 4px rgba(26,23,19,0.25);z-index:99998;pointer-events:none;transition:left .25s cubic-bezier(.4,0,.2,1),top .25s cubic-bezier(.4,0,.2,1),transform .12s;top:-50px;left:-50px;';
    const mount = () => { if (!document.getElementById('__demo_cursor')) document.body && document.body.appendChild(cursor); };
    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
    document.addEventListener('mousemove', (e) => { cursor.style.left = (e.clientX - 11) + 'px'; cursor.style.top = (e.clientY - 11) + 'px'; });
    document.addEventListener('mousedown', () => { cursor.style.transform = 'scale(0.72)'; });
    document.addEventListener('mouseup', () => { cursor.style.transform = 'scale(1)'; });
  })();
`;

const smoothCss = `
  /* gentle transition envelope so static screenshots stitched between
     animation states don't snap visually. motion/react cards keep their
     own springs; this only smooths element-level state changes. */
  *, *::before, *::after { transition-duration: .3s !important; transition-timing-function: cubic-bezier(.4,0,.2,1) !important; }
  html, body { scroll-behavior: smooth !important; }
`;

const iframeInject = `
  (function () {
    if (document.getElementById('__operator_pip')) return;
    const frame = document.createElement('iframe');
    frame.id = '__operator_pip';
    frame.src = '/operator';
    Object.assign(frame.style, {
      position: 'fixed', bottom: '24px', right: '28px',
      width: '380px', height: '780px', border: '8px solid #0f0d0a',
      borderRadius: '46px', boxShadow: '0 28px 60px -30px rgba(26,23,19,0.55), 0 0 0 1px rgba(26,23,19,0.10)',
      background: '#EFE9DD', zIndex: '9997', transform: 'scale(0.62) translateY(60px) translateX(50px)',
      transformOrigin: 'bottom right', opacity: '0',
      transition: 'opacity .8s ease-out, transform .8s cubic-bezier(.4,0,.2,1)',
    });
    document.body.appendChild(frame);
    window.__revealOperator = () => {
      frame.style.opacity = '1';
      frame.style.transform = 'scale(0.78) translateY(0) translateX(0)';
    };
    window.__pressOperatorAck = () => {
      // Reach into the iframe and dispatch a long-press on the LongPress button.
      try {
        const doc = frame.contentDocument;
        const btn = doc && doc.querySelector('button[aria-label]') || doc && doc.querySelectorAll('button')[doc.querySelectorAll('button').length - 1];
        if (!btn) return;
        // 320ms hold simulated by mousedown then mouseup after 360ms.
        const md = new MouseEvent('mousedown', { bubbles: true });
        btn.dispatchEvent(md);
        setTimeout(() => {
          const mu = new MouseEvent('mouseup', { bubbles: true });
          btn.dispatchEvent(mu);
        }, 360);
      } catch (err) { /* ignore */ }
    };
  })();
`;

(async () => {
  const events = [];
  const log = (name) => events.push({ name, t_ms: Date.now() - startedAt });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
    deviceScaleFactor: 1,
  });

  await ctx.addInitScript(cursorScript);
  const page = await ctx.newPage();

  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.addStyleTag({ content: smoothCss });
  await page.evaluate(iframeInject);

  // ── Recording starts now ───────────────────────────────────────────
  const startedAt = Date.now();
  log("recording_started");

  // Idle settle — let alabaster surface land
  await page.waitForTimeout(TIMES.fan_idle_settle);

  // Drift the cursor toward the upper-right (toward the hidden Karp hatch)
  await page.mouse.move(1900, 8, { steps: 18 });
  await page.waitForTimeout(TIMES.hit_karp - TIMES.fan_idle_settle - 1_000);

  // ── 0:14 — Karp scenario ───────────────────────────────────────────
  await page.mouse.move(1916, 5, { steps: 4 });
  log("hit_karp");
  await fetch("http://localhost:4000/api/scenarios/karp", { method: "POST" });

  // Move cursor back over the dashboard so the trail looks deliberate.
  await page.waitForTimeout(800);
  await page.mouse.move(960, 400, { steps: 36 });

  // wait until expected completion
  await page.waitForTimeout(TIMES.karp_window_end - (Date.now() - startedAt));
  log("karp_complete");

  // ── 0:51 — Recovery ────────────────────────────────────────────────
  await page.mouse.move(1916, 5, { steps: 24 });
  await page.waitForTimeout(TIMES.hit_recovery - (Date.now() - startedAt));
  log("hit_recovery");
  await fetch("http://localhost:4000/api/scenarios/recovery", { method: "POST" });
  // Madera card shake usually lands ~2.5-3s into the Recovery scenario
  await page.waitForTimeout(2_800);
  log("madera_shake");
  await page.mouse.move(960, 420, { steps: 30 });

  // wait until recovery completion
  await page.waitForTimeout(TIMES.recovery_window_end - (Date.now() - startedAt));
  log("recovery_complete");

  // ── 1:20 — Proactive ───────────────────────────────────────────────
  await page.mouse.move(1916, 5, { steps: 24 });
  await page.waitForTimeout(TIMES.hit_proactive - (Date.now() - startedAt));
  log("hit_proactive");
  await fetch("http://localhost:4000/api/scenarios/proactive", { method: "POST" });
  await page.mouse.move(960, 420, { steps: 30 });

  // ── 1:23 — Phone reveal ────────────────────────────────────────────
  await page.waitForTimeout(TIMES.reveal_phone - (Date.now() - startedAt));
  log("reveal_phone");
  await page.evaluate(() => window.__revealOperator && window.__revealOperator());

  // ── 1:32 — Staff long-press ack ────────────────────────────────────
  await page.waitForTimeout(TIMES.ack_press - (Date.now() - startedAt));
  log("ack_press");
  await page.evaluate(() => window.__pressOperatorAck && window.__pressOperatorAck());

  // ── 1:45 — Proactive Maestro voice expected (visual is the spoken-response chip)
  await page.waitForTimeout(TIMES.proactive_done_window - (Date.now() - startedAt));
  log("proactive_complete");

  // ── 1:53 — hold the closing frame ──────────────────────────────────
  await page.waitForTimeout(TIMES.hold_close - (Date.now() - startedAt));
  log("hold_close");

  // ── 1:57 — stop recording ──────────────────────────────────────────
  await page.waitForTimeout(TIMES.end - (Date.now() - startedAt));
  log("recording_stop");

  const videoHandle = page.video();
  await ctx.close();
  await browser.close();

  const finalPath = path.join(OUT, "trace.webm");
  if (videoHandle) {
    const tempPath = await videoHandle.path();
    fs.copyFileSync(tempPath, finalPath);
    try { fs.unlinkSync(tempPath); } catch {}
  }

  fs.writeFileSync(
    path.join(OUT, "events.json"),
    JSON.stringify({ startedAt, events, totalMs: Date.now() - startedAt }, null, 2),
  );

  console.log(`\nTrace recorded → ${finalPath}`);
  console.log(`Events → ${path.join(OUT, "events.json")}`);
  console.log(`Total: ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
