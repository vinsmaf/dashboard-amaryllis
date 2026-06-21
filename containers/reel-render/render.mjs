#!/usr/bin/env node
/**
 * render.mjs — Moteur de rendu d'un Reel Instagram 9:16 depuis un plan de montage JSON.
 *
 * Indépendant de toute infra : prend des photos/vidéos en entrée, sort un MP4
 * 1080×1920 H.264+AAC conforme aux specs Reels (moov atom en tête via +faststart).
 * Tourne en local (ffmpeg homebrew), et plus tard à l'identique dans un Container
 * Linux / GitHub Actions (ffmpeg natif). Le contrat = le plan de montage JSON.
 *
 * Usage :
 *   node render.mjs --out /tmp/reel.mp4
 *   node render.mjs --plan plan.json --photos-dir public/photos/amaryllis --audio music.mp3 --out reel.mp4
 *
 * Plan de montage (voir plan.example.json) :
 *   { bienId, title, fps, width, height, transition, transitionDuration,
 *     clips: [ { src, duration, kenburns: "in"|"out"|"left"|"right" }, ... ],
 *     audio? }
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ── Plan par défaut (POC : un Reel Villa Amaryllis depuis les photos du site) ──
const DEFAULT_PLAN = {
  bienId: "amaryllis",
  title: "Villa Amaryllis · Sainte-Luce",
  fps: 30, width: 1080, height: 1920,
  transition: "fade", transitionDuration: 0.5,
  clips: [
    { src: "01.webp", duration: 3, kenburns: "in" },
    { src: "03.webp", duration: 3, kenburns: "out" },
    { src: "05.webp", duration: 3, kenburns: "left" },
    { src: "07.webp", duration: 3, kenburns: "in" },
    { src: "09.webp", duration: 3, kenburns: "right" },
  ],
};

// ── Parse des arguments ────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--plan") a.plan = argv[++i];
    else if (argv[i] === "--photos-dir") a.photosDir = argv[++i];
    else if (argv[i] === "--audio") a.audio = argv[++i];
    else if (argv[i] === "--out") a.out = argv[++i];
  }
  return a;
}

// ── Détection d'une font pour le titre (bundlée d'abord, puis système) ──────────
function detectFont() {
  const candidates = [
    join(import.meta.dirname || ".", "assets", "DejaVuSans-Bold.ttf"), // bundlée (portable Linux)
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  ];
  return candidates.find(p => existsSync(p)) || null;
}

// ── Échappe le texte pour drawtext (les ':' et '\' sont spéciaux) ──────────────
function escapeDraw(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "’");
}

// ── Filtre Ken Burns pour une photo (upscale ×2 pour la netteté, puis zoompan) ─
function kenburnsFilter(type, dur, fps, W, H) {
  const d = Math.round(dur * fps);
  const up = `scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W * 2}:${H * 2}`;
  let z, x, y;
  if (type === "out") {
    z = `if(eq(on,0),1.2,max(zoom-0.0015,1.0))`;
    x = `iw/2-(iw/zoom/2)`; y = `ih/2-(ih/zoom/2)`;
  } else if (type === "left") {
    z = `1.15`; x = `(iw-iw/zoom)*(on/${d})`; y = `ih/2-(ih/zoom/2)`;
  } else if (type === "right") {
    z = `1.15`; x = `(iw-iw/zoom)*(1-on/${d})`; y = `ih/2-(ih/zoom/2)`;
  } else { // "in"
    z = `min(zoom+0.0015,1.2)`; x = `iw/2-(iw/zoom/2)`; y = `ih/2-(ih/zoom/2)`;
  }
  return `${up},zoompan=z='${z}':x='${x}':y='${y}':d=${d}:s=${W}x${H}:fps=${fps},format=yuv420p,setsar=1`;
}

function run(bin, args) {
  try {
    return execFileSync(bin, args, { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    const msg = (e.stderr ? e.stderr.toString() : "") || e.message;
    throw new Error(`${bin} a échoué :\n${msg.split("\n").slice(-12).join("\n")}`);
  }
}

// drawtext n'est pas toujours compilé (ffmpeg sans libfreetype). En prod le titre
// = title card PNG (Nano Banana) en overlay ; drawtext n'est qu'un fallback simple.
function hasFilter(name) {
  try {
    const out = execFileSync("ffmpeg", ["-hide_banner", "-filters"], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 16 * 1024 * 1024 }).toString();
    return new RegExp(`\\b${name}\\b`).test(out);
  } catch { return false; }
}

// ── Programme principal ────────────────────────────────────────────────────────
function main() {
  const args = parseArgs(process.argv.slice(2));
  const plan = args.plan ? JSON.parse(readFileSync(args.plan, "utf8")) : DEFAULT_PLAN;
  const out = args.out || "/tmp/reel.mp4";
  const photosDir = args.photosDir || join("public", "photos", plan.bienId || "amaryllis");
  const audio = args.audio || plan.audio || null;

  const W = plan.width || 1080, H = plan.height || 1920, FPS = plan.fps || 30;
  const T = plan.transitionDuration ?? 0.5;
  const FONT = detectFont();
  if (!FONT) console.warn("⚠️  Aucune font trouvée → titre désactivé. Bundler assets/DejaVuSans-Bold.ttf pour le texte.");

  const clips = plan.clips || [];
  if (!clips.length) { console.error("✗ Plan sans clips."); process.exit(1); }

  const work = mkdtempSync(join(tmpdir(), "reel-"));
  try {
    // ── 1. Un clip Ken Burns par photo ──────────────────────────────────────────
    const clipPaths = [];
    clips.forEach((clip, i) => {
      const src = join(photosDir, clip.src);
      if (!existsSync(src)) throw new Error(`Photo introuvable : ${src}`);
      const dur = clip.duration || 3;
      const kb = clip.kenburns || (i % 2 ? "out" : "in");
      const clipOut = join(work, `clip${i}.mp4`);
      run("ffmpeg", [
        "-y", "-loop", "1", "-i", src, "-t", String(dur),
        "-filter_complex", kenburnsFilter(kb, dur, FPS, W, H),
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", "-r", String(FPS), clipOut,
      ]);
      clipPaths.push({ path: clipOut, dur });
      console.log(`  ✓ clip ${i + 1}/${clips.length} (${clip.src}, ${kb}, ${dur}s)`);
    });

    // ── 2. Chaîne de crossfades (offset cumulé, gère durées variables) ──────────
    const fc = [];
    let prev = "[0:v]";
    let acc = clipPaths[0].dur;
    for (let i = 1; i < clipPaths.length; i++) {
      const off = (acc - T).toFixed(3);
      const label = `[vx${i}]`;
      fc.push(`${prev}[${i}:v]xfade=transition=${plan.transition || "fade"}:duration=${T}:offset=${off}${label}`);
      prev = label;
      acc = acc + clipPaths[i].dur - T;
    }

    // ── 3. Titre (drawtext, bandeau bas semi-transparent) ───────────────────────
    if (FONT && plan.title && hasFilter("drawtext")) {
      const label = "[vout]";
      fc.push(`${prev}drawtext=fontfile='${FONT}':text='${escapeDraw(plan.title)}':fontcolor=white:fontsize=58:box=1:boxcolor=black@0.45:boxborderw=24:x=(w-text_w)/2:y=h-260${label}`);
      prev = label;
    } else if (plan.title) {
      console.warn("⚠️  Titre désactivé (drawtext indispo) — title card PNG/overlay (Nano Banana) viendra en Phase 3.");
    }

    // ── 4. Assemblage final (Meta-conforme : H.264 high + AAC 48k + faststart) ──
    const ff = ["-y"];
    clipPaths.forEach(c => ff.push("-i", c.path));
    const audioIdx = clipPaths.length;
    if (audio && existsSync(audio)) ff.push("-i", audio);
    else ff.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000");

    if (fc.length) ff.push("-filter_complex", fc.join(";"), "-map", prev);
    else ff.push("-map", "0:v");
    ff.push("-map", `${audioIdx}:a`);

    ff.push(
      "-c:v", "libx264", "-profile:v", "high", "-preset", "medium", "-crf", "20",
      "-pix_fmt", "yuv420p", "-r", String(FPS),
      "-c:a", "aac", "-b:a", "128k", "-ar", "48000",
      "-shortest", "-movflags", "+faststart", out,
    );
    run("ffmpeg", ff);

    const probe = run("ffprobe", [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height,duration,codec_name",
      "-of", "default=noprint_wrappers=1", out,
    ]).toString().trim().replace(/\n/g, " · ");
    console.log(`\n✅ Reel rendu → ${out}\n   ${probe}`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

main();
