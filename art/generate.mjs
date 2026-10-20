// Generates the LupiOS artwork (SVG) into files/system/usr/share/lupios/art/.
// The image build turns these into PNGs (files/scripts/look.sh).
// Run from the repo root:  node art/generate.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const OUT = "files/system/usr/share/lupios/art";
mkdirSync(OUT, { recursive: true });

// ---- Palette -----------------------------------------------------------------
// The OS: a naturalist's sketchbook, pencil and ink on paper (light, the default), and the same
// forest at dusk for the dark scheme, the boot screen and the terminal. No colour, by design.
const C = {
  paper: "#F3F1EB", shade: "#EBE8E0", wash: "#E4E1D9", rule: "#D9D6CC",
  pencilLight: "#A4A9A5", graphite: "#555A57", pencil: "#3C413E", ink: "#191B1A",
  charcoal: "#0E100F", dusk: "#171A18", far: "#262B28", mid: "#1B1F1D", near: "#0F1110",
  ash: "#959B97", bone: "#E9E7E0", white: "#F4F2EC",
};
// The website (website/) keeps the night palette until it moves to the new look too
const NIGHT = {
  frost: "#CFF3FF",
  ice: "#8BE0FF",
  accent: "#33B5F0",
  deep: "#1D7FC0",
  abyss: "#0F4C7A",
  trench: "#0A2F4F",
  night: "#0B1220",
  text: "#DDF4FF",
};

const svg = (w, h, body, extra = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"${extra}>\n  ${body}\n</svg>\n`;
const poly = (pts, fill, extra = "") =>
  `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="${fill}"${extra}/>`;

// ---- The logo: vukkz's design, as outlines in art/logo/ ----------------------------------
// Each file is one black path of straight segments, filled even-odd. Drawn here in the LupiOS
// colours: ice-blue lines on dark backgrounds, deep blue on light ones.
function loadLogo(file) {
  const text = readFileSync(file, "utf8");
  const [, w, h] = text.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const d = text.match(/ d="([^"]+)"/)[1];
  const loops = d.split("Z").filter((s) => s.trim()).map((s) =>
    s.replace(/^\s*M/, "").split("L").map((p) => p.trim().split(/[\s,]+/).map(Number)));
  return { w: +w, h: +h, d, loops };
}
const MARK = loadLogo("art/logo/lupios-mark.svg");
const WORD = loadLogo("art/logo/lupios-wordmark.svg");
const heightAt = (part, width) => (width * part.h) / part.w;

// One logo part, `width` wide, its top-left corner at (x, y). `bold` thickens the lines by that
// much (in final units): at icon sizes the drawn lines get too thin to see.
function place(part, { x = 0, y = 0, width, fill, bold = 0, extra = "" }) {
  const s = width / part.w;
  const stroke = bold ? ` stroke="${fill}" stroke-width="${(bold / s).toFixed(2)}" stroke-linejoin="round"` : "";
  return `<path transform="translate(${+x.toFixed(2)} ${+y.toFixed(2)}) scale(${+s.toFixed(5)})" fill="${fill}" fill-rule="evenodd"${stroke}${extra} d="${part.d}"/>`;
}

// A soft glow behind the mark: a blurred copy in the accent colour (the website's night art)
const glowFilter = (id, blur) =>
  `<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="${blur}"/></filter>`;
const glowing = (part, opts, { id, opacity }) =>
  `${place(part, { ...opts, fill: NIGHT.accent, extra: ` filter="url(#${id})" opacity="${opacity}"` })}\n  ${place(part, opts)}`;

// Icon: app-menu button (start-here), tray widget, About page, Welcome, os-release LOGO. Drawn in
// KDE's "current-color-scheme" text colour, so Plasma inks it like its own monochrome icons: ink on
// the paper scheme, bone on the dark one (and ink wherever nothing recolours it). The small version,
// with thicker lines, is installed for the 16-32 px sizes (look.sh).
const icon = (bold) =>
  svg(256, 256, `<style id="current-color-scheme">.ColorScheme-Text { color: ${C.ink}; }</style>
  ${place(MARK, { x: 10, y: (256 - heightAt(MARK, 236)) / 2, width: 236, fill: "currentColor", bold, extra: ` class="ColorScheme-Text"` })}`);
writeFileSync(`${OUT}/lupios-logo.svg`, icon(0));
writeFileSync(`${OUT}/lupios-logo-small.svg`, icon(8));

// Emblem: the mark above the name, for the boot screen (Plymouth renders it 260 px tall). The boot
// screen stays dark, the forest at dusk: Fedora's password box and spinner are made for dark, and a
// white screen at night is harsh. So it's drawn in bone and white.
writeFileSync(
  `${OUT}/lupios-emblem.svg`,
  svg(400, 320, `${place(MARK, { x: 105, y: 18, width: 190, fill: C.bone })}
  ${place(WORD, { x: 100, y: 248, width: 200, fill: C.white })}`),
);

// ---- Seeded random, so the art comes out the same every run ------------------------------
function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}
// the drawings use a second, better-mixed one (mulberry32): the LCG above repeats patterns at
// the many small steps a branch takes
function rand32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const n1 = (v) => v.toFixed(1);

// A mountain ridge (the website's night art): `peaks` sharp summits with small shoulders and valleys
function ridge(rand, { baseY, amp, peaks, W }) {
  const pts = [[0, baseY - amp * 0.2 * rand()]];
  const r = (v) => Math.round(v);
  for (let x = 0; x < W; ) {
    const w = (W / peaks) * (0.6 + rand() * 0.8);
    const px = x + w * (0.35 + rand() * 0.3);
    const py = baseY - amp * (0.45 + rand() * 0.55);
    pts.push([r(px - w * 0.18), r(py + amp * (0.15 + rand() * 0.15))]); // left shoulder
    pts.push([r(px), r(py)]); // summit
    pts.push([r(px + w * 0.14), r(py + amp * (0.12 + rand() * 0.15))]); // right shoulder
    x += w;
    pts.push([r(x), r(baseY - amp * 0.15 * rand())]); // valley
  }
  return pts;
}

// ---- Drawing: branches and spruces, like a naturalist's pencil studies -----------------------
// A limb wanders a little and bends as it grows, and tapers to its tip; twigs grow off it, and
// leaves or needles off the twigs. Drawn as filled outlines, so the taper is real.
function limb(r, x, y, a, len, w0, bend) {
  const steps = Math.max(8, Math.round(len / 10)), pts = [];
  for (let i = 0; i <= steps; i++) {
    pts.push({ x, y, a, w: Math.max(0.6, w0 * (1 - (i / steps) * 0.88)) });
    a += (r() - 0.5) * 0.14 + bend / steps;
    x += (Math.cos(a) * len) / steps;
    y += (Math.sin(a) * len) / steps;
  }
  return pts;
}
function taper(pts) {
  const L = [], R = [];
  pts.forEach((p, i) => {
    const q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
    const dx = q.x - o.x, dy = q.y - o.y, n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n;
    L.push(`${n1(p.x + (nx * p.w) / 2)} ${n1(p.y + (ny * p.w) / 2)}`);
    R.push(`${n1(p.x - (nx * p.w) / 2)} ${n1(p.y - (ny * p.w) / 2)}`);
  });
  return `M${[...L, ...R.reverse()].join("L")}Z`;
}
// pine needles: short curved strokes both sides of a twig, pointing forward
function needles(r, pts, len) {
  let d = "";
  for (let i = 2; i < pts.length; i += 2) {
    const p = pts[i];
    for (const side of [-1, 1]) {
      const a = p.a + side * (0.55 + r() * 0.35), l = len * (0.7 + r() * 0.5) * (1 - (i / pts.length) * 0.35);
      d += `M${n1(p.x)} ${n1(p.y)}q${n1(Math.cos(a) * l * 0.5 + side * 2)} ${n1(Math.sin(a) * l * 0.5)} ${n1(Math.cos(a) * l)} ${n1(Math.sin(a) * l)}`;
    }
  }
  return d;
}
// a leaf (birch, alder): two arcs and a midrib
function leaf(r, x, y, a, size) {
  const l = size * (0.8 + r() * 0.4), wd = l * 0.42, tx = x + Math.cos(a) * l, ty = y + Math.sin(a) * l;
  const nx = -Math.sin(a) * wd, ny = Math.cos(a) * wd, mx = x + Math.cos(a) * l * 0.45, my = y + Math.sin(a) * l * 0.45;
  return {
    outline: `M${n1(x)} ${n1(y)}Q${n1(mx + nx)} ${n1(my + ny)} ${n1(tx)} ${n1(ty)}Q${n1(mx - nx)} ${n1(my - ny)} ${n1(x)} ${n1(y)}Z`,
    rib: `M${n1(x)} ${n1(y)}L${n1(x + Math.cos(a) * l * 0.85)} ${n1(y + Math.sin(a) * l * 0.85)}`,
  };
}
function grow(r, out, x, y, a, len, w, depth, o) {
  const pts = limb(r, x, y, a, len, w, o.bend * (0.6 + r() * 0.8));
  out.limbs.push(taper(pts));
  if (o.kind === "pine" && depth <= 1) out.needles.push(needles(r, pts, o.needle));
  if (o.kind === "leaf" && depth <= 1) {
    for (let i = 3; i < pts.length; i += 4) {
      const p = pts[i], side = i % 8 < 4 ? 1 : -1;
      if (r() < 0.6) out.leaves.push(leaf(r, p.x, p.y, p.a + side * (0.7 + r() * 0.4) + 0.25, o.leaf));
    }
    const e = pts[pts.length - 1];
    out.leaves.push(leaf(r, e.x, e.y, e.a, o.leaf * 1.1));
  }
  if (depth <= 0) return;
  const n = o.twigs[0] + Math.floor(r() * (o.twigs[1] - o.twigs[0] + 1));
  for (let k = 0; k < n; k++) {
    const t = 0.18 + (0.75 * (k + r() * 0.6)) / n;
    const p = pts[Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)))];
    grow(r, out, p.x, p.y, p.a + (k % 2 ? 1 : -1) * (0.45 + r() * 0.5), len * (0.32 + r() * 0.22) * (1 - t * 0.35), p.w * 0.62, depth - 1, o);
  }
}
function branch(seed, x, y, a, len, w, o) {
  const out = { limbs: [], needles: [], leaves: [] };
  grow(rand32(seed), out, x, y, a, len, w, o.depth, o);
  return out;
}
// a branch drawn: the limbs filled, the needles or leaves stroked
function drawn(b, { color, needle = 2, leafLine = 2.4, rib = 1.6, leafFill = "none", opacity = 1, filter = "" }) {
  return `<g opacity="${opacity}"${filter ? ` filter="url(#${filter})"` : ""}>
    <path d="${b.limbs.join("")}" fill="${color}"/>
    ${b.needles.length ? `<path d="${b.needles.join("")}" fill="none" stroke="${color}" stroke-width="${needle}" stroke-linecap="round"/>` : ""}
    ${b.leaves.length ? `<path d="${b.leaves.map((l) => l.outline).join("")}" fill="${leafFill}" stroke="${color}" stroke-width="${leafLine}" stroke-linejoin="round"/>
    <path d="${b.leaves.map((l) => l.rib).join("")}" fill="none" stroke="${color}" stroke-width="${rib}" stroke-linecap="round"/>` : ""}
  </g>`;
}

// A spruce: tiers of fronds that arc out and droop to a tip, then curve back in to the next tier
function spruce(r, cx, base, h, w) {
  const top = base - h, tiers = 9 + Math.floor(r() * 4), tw = Math.max(2, w * 0.03), rows = [];
  for (let i = 1; i <= tiers; i++) {
    const t = i / tiers;
    rows.push({ y: top + t * h * 0.88, half: (w / 2) * Math.pow(t, 0.8) * (0.85 + r() * 0.3), droop: h * 0.03 * (0.7 + r() * 0.7), lean: (r() - 0.5) * 0.15 });
  }
  let d = `M${n1(cx)} ${n1(top)}`, prevY = top;
  for (const k of rows) {
    const hx = k.half * (1 + k.lean);
    d += `Q${n1(cx - hx * 0.45)} ${n1(prevY + (k.y - prevY) * 0.55)} ${n1(cx - hx)} ${n1(k.y + k.droop)}`;
    d += `Q${n1(cx - hx * 0.5)} ${n1(k.y + k.droop * 0.2)} ${n1(cx - hx * 0.22)} ${n1(k.y + h * 0.012)}`;
    prevY = k.y;
  }
  d += `L${n1(cx - tw)} ${n1(base)}L${n1(cx + tw)} ${n1(base)}`;
  const rev = [...rows].reverse();
  rev.forEach((k, i) => {
    const hx = k.half * (1 - k.lean), nextY = i + 1 < rev.length ? rev[i + 1].y : top;
    d += `L${n1(cx + hx * 0.22)} ${n1(k.y + h * 0.012)}Q${n1(cx + hx * 0.5)} ${n1(k.y + k.droop * 0.2)} ${n1(cx + hx)} ${n1(k.y + k.droop)}`;
    d += `Q${n1(cx + hx * 0.45)} ${n1(nextY + (k.y - nextY) * 0.55)} ${n1(cx)} ${n1(nextY)}`;
  });
  return d + "Z";
}
// A row of spruces across the picture; keep(x) decides where they stand (near ones frame the edges).
// Filled, with the ground under them, or only outlined (pencil).
function forest({ seed, W, H, base, h: [hMin, hMax], gap, keep = () => true }) {
  const r = rand32(seed);
  let d = "";
  for (let x = -gap; x < W + gap; x += gap * (0.55 + r() * 0.9)) {
    const h = hMin + r() * (hMax - hMin), tree = spruce(r, x, base + r() * 18, h, h * (0.34 + r() * 0.1));
    if (keep(x)) d += tree;
  }
  return { d, ground: `<rect x="0" y="${n1(base)}" width="${W}" height="${n1(H - base + 40)}"` };
}
const filledForest = (o, fill) => {
  const f = forest(o);
  return `<path d="${f.d}" fill="${fill}"/>${f.ground} fill="${fill}"/>`;
};
const pencilForest = (o, stroke, width, opacity = 1) =>
  `<path d="${forest(o).d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" opacity="${opacity}" filter="url(#wobble)"/>`;
// a pencil line isn't ruler-straight: a gentle, low-frequency wobble
const wobble = (scale) =>
  `<filter id="wobble"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>`;

// ---- Wallpapers: Paper (the default, with Forest as its dark-scheme side), Forest, Emblem -----
// Plasma shows a wallpaper package's images_dark/ instead of images/ when the colour scheme is
// dark, so the default follows the user's light or dark choice (look.sh builds both).
function paperWall({ W = 3840, H = 2160 } = {}) {
  const twig = branch(42, W + 60, H * 0.075, Math.PI - 0.32, W * 0.59, 27, { kind: "leaf", depth: 3, bend: -0.55, twigs: [3, 5], leaf: 66 });
  return svg(W, H, `<defs>${wobble(7)}</defs>
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  ${filledForest({ seed: 5, W, H, base: H * 0.95, h: [H * 0.1, H * 0.18], gap: W * 0.035 }, C.wash)}
  ${pencilForest({ seed: 9, W, H, base: H * 1.025, h: [H * 0.27, H * 0.45], gap: W * 0.078, keep: (x) => x < W * 0.27 }, C.pencil, 3.4, 0.8)}
  ${drawn(twig, { color: C.pencil, leafLine: 3.4, rib: 2.2, leafFill: C.paper, opacity: 0.9, filter: "wobble" })}`);
}
function forestWall({ W = 3840, H = 2160 } = {}) {
  const pine = branch(11, -120, -90, 0.42, W * 0.586, 33, { kind: "pine", depth: 2, bend: 0.38, twigs: [4, 5], needle: 45 });
  return svg(W, H, `<defs>${wobble(9)}
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B0C0C"/><stop offset="0.62" stop-color="#181B19"/><stop offset="1" stop-color="#121413"/></linearGradient>
    <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFD4CF" stop-opacity="0"/><stop offset="0.5" stop-color="#CFD4CF" stop-opacity="0.07"/><stop offset="1" stop-color="#CFD4CF" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${filledForest({ seed: 5, W, H, base: H * 0.78, h: [H * 0.106, H * 0.19], gap: W * 0.037 }, C.far)}
  <rect y="${H * 0.7}" width="${W}" height="${H * 0.16}" fill="url(#mist)"/>
  ${filledForest({ seed: 8, W, H, base: H * 0.875, h: [H * 0.19, H * 0.325], gap: W * 0.0586, keep: (x) => x < W * 0.35 || x > W * 0.586 }, C.mid)}
  <rect y="${H * 0.806}" width="${W}" height="${H * 0.1375}" fill="url(#mist)"/>
  ${filledForest({ seed: 13, W, H, base: H * 1.025, h: [H * 0.4375, H * 0.72], gap: W * 0.09, keep: (x) => x < W * 0.164 || x > W * 0.85 }, C.near)}
  ${drawn(pine, { color: C.bone, needle: 2.4, opacity: 0.34, filter: "wobble" })}`);
}
// The mark alone, drawn large, above a low treeline: ink on paper, or bone at dusk
function emblemWall({ dark, W = 3840, H = 2160 }) {
  const width = 640, h = heightAt(MARK, width);
  return svg(W, H, `<defs>${wobble(6)}</defs>
  <rect width="${W}" height="${H}" fill="${dark ? C.charcoal : C.paper}"/>
  ${dark
    ? filledForest({ seed: 21, W, H, base: H * 0.97, h: [H * 0.08, H * 0.15], gap: W * 0.03 }, C.far)
    : pencilForest({ seed: 21, W, H, base: H * 0.97, h: [H * 0.08, H * 0.15], gap: W * 0.03 }, C.pencilLight, 2.6)}
  ${place(MARK, { x: (W - width) / 2, y: H * 0.43 - h / 2, width, fill: dark ? C.bone : C.pencil })}`);
}
writeFileSync(`${OUT}/wallpaper-paper.svg`, paperWall());
writeFileSync(`${OUT}/wallpaper-forest.svg`, forestWall());
writeFileSync(`${OUT}/wallpaper-emblem.svg`, emblemWall({ dark: false }));
writeFileSync(`${OUT}/wallpaper-emblem-dark.svg`, emblemWall({ dark: true }));

// ---- Terminal logo for fastfetch: the mark in Braille dots -------------------------------
// Each Braille character is a 2 x 4 grid of dots, and terminal cells are twice as tall as wide,
// so the dots are square: fine enough for the logo's lines. Each dot is on if enough of its
// area is inside the mark (3 x 3 samples, even-odd like the SVG fill).
function insideMark(px, py) {
  let inside = false;
  for (const loop of MARK.loops)
    for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
      const [xi, yi] = loop[i], [xj, yj] = loop[j];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
    }
  return inside;
}
function terminalLogo(cols = 30) {
  const dot = MARK.w / (cols * 2), rows = Math.ceil(MARK.h / dot / 4);
  const bits = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]]; // [row][column] in a cell
  const on = (dx, dy) => {
    let hits = 0;
    for (let sy = 0; sy < 3; sy++)
      for (let sx = 0; sx < 3; sx++) hits += insideMark((dx + (sx + 0.5) / 3) * dot, (dy + (sy + 0.5) / 3) * dot);
    return hits >= 3;
  };
  const lines = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      let b = 0;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 2; x++) if (on(c * 2 + x, r * 4 + y)) b |= bits[y][x];
      line += b ? String.fromCodePoint(0x2800 + b) : " ";
    }
    lines.push(line.trimEnd());
  }
  return lines.map((l) => (l ? `$1${l}` : l)).join("\n") + "\n";
}
writeFileSync("files/system/usr/share/lupios/fastfetch-logo.txt", terminalLogo());

// ---- Installer (Anaconda) sidebar and top bar: iso/anaconda/ -----------------------------
// The installer runs on Fedora's own packages, which brand it as Fedora. build-iso.yml turns
// these into PNGs and iso/anaconda/lupios-look.tmpl puts them in place of Fedora's.
const ISO = "iso/anaconda";
mkdirSync(ISO, { recursive: true });

// Top of the sidebar (about 190 px wide): the mark above the name, in ink on the paper sidebar
writeFileSync(
  `${ISO}/sidebar-logo.svg`,
  svg(170, 138, `${place(MARK, { x: 43, y: 2, width: 84, fill: C.ink })}
  ${place(WORD, { x: 30, y: 102, width: 110, fill: C.ink })}`),
);

// Behind it: paper, and a treeline along the foot (a wash of far spruces, nearer ones in pencil).
// The stylesheet scales it to cover the sidebar and pins the bottom, so the trees always show.
function sidebarBg() {
  const W = 400, H = 1200;
  return svg(W, H, `<defs>${wobble(3)}</defs>
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  ${filledForest({ seed: 31, W, H, base: H * 0.97, h: [90, 170], gap: 34 }, C.wash)}
  ${pencilForest({ seed: 33, W, H, base: H * 1.02, h: [190, 320], gap: 82 }, C.pencil, 1.8, 0.85)}`);
}
writeFileSync(`${ISO}/sidebar-bg.svg`, sidebarBg());

// The bar at the top of each installer page (Keyboard, Installation Destination, ...): an ink band,
// like a book's running head, so the installer's white text on it stays readable
writeFileSync(
  `${ISO}/topbar-bg.svg`,
  svg(1600, 80, `<rect width="1600" height="80" fill="${C.ink}"/>
  <rect y="78" width="1600" height="2" fill="${C.graphite}"/>`),
);

// ---- Website (website/): logo, favicon and the mountains behind the home page's title -------
// Two versions of the mountains, one per site theme. The front ridge has the page's own
// background colour, so the picture melts into the page below it.
const WEB = "website/src/assets";
mkdirSync(WEB, { recursive: true });
mkdirSync("website/public", { recursive: true });
// The mark (home page) and the mark beside the name (top bar), for the dark and the light theme
for (const [theme, mark, name] of [["dark", NIGHT.ice, NIGHT.frost], ["light", NIGHT.abyss, NIGHT.night]]) {
  writeFileSync(`${WEB}/lupios-mark-${theme}.svg`, svg(256, 256, place(MARK, { x: 10, y: (256 - heightAt(MARK, 236)) / 2, width: 236, fill: mark })));
  writeFileSync(`${WEB}/lupios-lockup-${theme}.svg`, svg(318, 100, `${place(MARK, { x: 0, y: 0, width: 101, fill: mark })}
  ${place(WORD, { x: 126, y: 50 - heightAt(WORD, 192) / 2, width: 192, fill: name })}`));
}
// Browser tabs can be light or dark, so the favicon brings its own navy tile
writeFileSync("website/public/favicon.svg", svg(256, 256, `<rect width="256" height="256" rx="56" fill="${NIGHT.night}"/>
  ${place(MARK, { x: 34, y: (256 - heightAt(MARK, 188)) / 2, width: 188, fill: NIGHT.ice, bold: 8 })}`));

function heroMountains({ sky, star, layers, snow }) {
  const W = 2400, H = 900, rand = rng(1312), sr = rng(77); // separate, so both themes get the same mountains
  const stars = star
    ? Array.from({ length: 160 }, () => {
        const x = Math.round(sr() * W), y = Math.round(sr() * H * 0.55);
        const r = (sr() < 0.08 ? 2.2 : 0.9 + sr() * 0.9).toFixed(1);
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="${star}" opacity="${(0.2 + sr() * 0.55).toFixed(2)}"/>`;
      }).join("")
    : "";
  const ridges = layers.map((l) => {
    const top = ridge(rand, { ...l, W });
    const line = top.map((p) => p.join(",")).join(" ");
    return `${poly([...top, [W, H], [0, H]], l.fill)}<polyline points="${line}" fill="none" stroke="${snow}" stroke-width="2.5" opacity="${l.snow}"/>`;
  }).join("\n  ");
  return svg(W, H, `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      ${sky.map((c, i) => `<stop offset="${i / (sky.length - 1)}" stop-color="${c}"/>`).join("")}
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars}
  ${ridges}`, ` preserveAspectRatio="xMidYMax slice"`);
}
writeFileSync(`${WEB}/hero-night.svg`, heroMountains({
  sky: [NIGHT.night, "#0C1A2C", "#10233A"], star: NIGHT.text, snow: NIGHT.ice,
  layers: [
    { baseY: 680, amp: 230, peaks: 4, fill: "#12243A", snow: 0.3 },
    { baseY: 780, amp: 170, peaks: 6, fill: "#0E1C2E", snow: 0.18 },
    { baseY: 870, amp: 100, peaks: 8, fill: NIGHT.night, snow: 0.12 },
  ],
}));
writeFileSync(`${WEB}/hero-day.svg`, heroMountains({
  sky: ["#F7FBFE", "#E3F4FC", "#CDEBF8"], star: null, snow: "#FFFFFF",
  layers: [
    { baseY: 680, amp: 230, peaks: 4, fill: "#B4DCF0", snow: 0.9 },
    { baseY: 780, amp: 170, peaks: 6, fill: "#D5ECF8", snow: 0.9 },
    { baseY: 870, amp: 100, peaks: 8, fill: "#F7FBFE", snow: 0.9 },
  ],
}));

// The home page's ridge linework (website/src/pages/index.astro): the same mountains as the hero,
// drawn only as their ice-blue outlines, like the hairlines of a field guide's plates.
{
  const W = 2400, H = 260, rand = rng(1312);
  const lines = [
    { baseY: 170, amp: 150, peaks: 5, opacity: 0.38 },
    { baseY: 215, amp: 110, peaks: 7, opacity: 0.22 },
    { baseY: 250, amp: 70, peaks: 9, opacity: 0.12 },
  ].map((l) => `<polyline points="${ridge(rand, { ...l, W }).map((p) => p.join(",")).join(" ")}" fill="none" stroke="${NIGHT.ice}" stroke-width="2" stroke-linejoin="round" opacity="${l.opacity}"/>`);
  writeFileSync(`${WEB}/guide-ridge.svg`, svg(W, H, lines.join("\n  "), ` preserveAspectRatio="xMidYMax slice"`));
}

// The picture a shared link shows (og:image, 1200x630; also the repo's social preview). The website
// build turns it into og.png (website/scripts/og-image.mjs). Shapes only, no text: it renders the same
// everywhere, and the page title and description appear under the picture anyway.
{
  const W = 1200, H = 630, rand = rng(1312), sr = rng(77);
  const stars = Array.from({ length: 70 }, () => {
    const r = (sr() < 0.08 ? 1.8 : 0.7 + sr() * 0.8).toFixed(1);
    return `<circle cx="${Math.round(sr() * W)}" cy="${Math.round(sr() * H * 0.5)}" r="${r}" fill="${NIGHT.text}" opacity="${(0.2 + sr() * 0.5).toFixed(2)}"/>`;
  }).join("");
  const ridges = [
    { baseY: 520, amp: 150, peaks: 4, fill: "#12243A", snow: 0.3 },
    { baseY: 580, amp: 110, peaks: 6, fill: "#0E1C2E", snow: 0.18 },
    { baseY: 625, amp: 60, peaks: 8, fill: NIGHT.night, snow: 0.12 },
  ].map((l) => {
    const top = ridge(rand, { ...l, W });
    return `${poly([...top, [W, H], [0, H]], l.fill)}<polyline points="${top.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${NIGHT.ice}" stroke-width="2" opacity="${l.snow}"/>`;
  }).join("\n  ");
  // The mark and the name side by side, centred above the mountains
  const markW = 170, gap = 44, wordW = 430, x0 = (W - markW - gap - wordW) / 2, cy = 235;
  writeFileSync(`${WEB}/og.svg`, svg(W, H, `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${NIGHT.night}"/><stop offset="1" stop-color="#10233A"/></linearGradient>
    ${glowFilter("og-glow", 14)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars}
  ${ridges}
  ${glowing(MARK, { x: x0, y: cy - heightAt(MARK, markW) / 2, width: markW, fill: NIGHT.ice }, { id: "og-glow", opacity: 0.55 })}
  ${place(WORD, { x: x0 + markW + gap, y: cy - heightAt(WORD, wordW) / 2, width: wordW, fill: NIGHT.frost })}`));
}

// ---- Preview page: open art/preview.html in a browser to check everything at once -------
const uri = (f, dir = OUT) => `data:image/svg+xml;base64,${Buffer.from(readFileSync(`${dir}/${f}`)).toString("base64")}`;
const logo = uri("lupios-logo.svg"), small = uri("lupios-logo-small.svg");
writeFileSync(
  "art/preview.html",
  `<!doctype html><html><head><meta charset="utf-8"><title>LupiOS art preview</title><style>
body{margin:0;background:#1a1d21;color:#ddd;font:14px sans-serif}
.row{display:flex;gap:24px;align-items:end;padding:16px;flex-wrap:wrap}
.light{background:#eff0f1;color:#222}
.panel{background:#171a18;padding:6px 10px;display:flex;gap:12px;align-items:center}
.panel.paper{background:#ebe8e0;color:#191b1a}
img.wp{width:760px;display:block}
.ply{background:linear-gradient(#171a18,#0e100f);width:760px;height:428px;display:flex;flex-direction:column;align-items:center;justify-content:center}
.inst{display:flex;width:760px;height:475px;background:#f5f4f2;color:#2e3436}
.inst .side{width:120px;background:#F3F1EB url(${uri("sidebar-bg.svg", ISO)}) 50% 100%/cover no-repeat;border-right:1px solid #d9d6cc}
.inst .side div{height:100%;background:url(${uri("sidebar-logo.svg", ISO)}) 50% 20px/106px no-repeat}
.inst .main{flex:1;padding:14px 20px}.inst .top{text-align:right;font-size:11px}
.inst .bar{height:34px;margin:12px -20px;background:url(${uri("topbar-bg.svg", ISO)}) 0 0/cover;color:#fff;padding:9px 20px;box-sizing:border-box;font-size:12px}
</style></head><body>
<div class="row"><img src="${logo}" width="256"><img src="${logo}" width="64"><span>icon (48 px and up)</span>
<img src="${small}" width="32"><img src="${small}" width="22"><img src="${small}" width="16"><span>small icon, thicker lines (16-32 px)</span>
<div class="panel paper"><img src="${small}" width="24"><span>paper panel, 24px (Plasma inks the icon itself: bone on a dark panel)</span></div></div>
<div class="row"><div class="ply"><img src="${uri("lupios-emblem.svg")}" height="200">
<div style="margin-top:60px;opacity:.6">boot screen: the password box goes here</div></div></div>
<div class="row"><img class="wp" src="${uri("wallpaper-paper.svg")}"><img class="wp" src="${uri("wallpaper-forest.svg")}">
<span>wallpapers: Paper (the default; Forest is its dark-scheme side), Forest</span></div>
<div class="row"><img class="wp" src="${uri("wallpaper-emblem.svg")}"><img class="wp" src="${uri("wallpaper-emblem-dark.svg")}"><span>Emblem, light and dark</span></div>
<div class="row"><div class="inst"><div class="side"><div></div></div><div class="main"><div class="top">LUPIOS 44 INSTALLATION</div>
<h3>WELCOME TO LUPIOS 44.</h3><div class="bar">INSTALLATION DESTINATION (the bar at the top of each page)</div>
What language would you like to use during the installation process?</div></div>
<span>installer, at 60% size (build-iso.yml)</span></div>
</body></html>
`,
);
console.log("wrote", OUT, "and art/preview.html");
