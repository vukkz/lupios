// Generates the LupiOS artwork (SVG) into files/system/usr/share/lupios/art/.
// The image build turns these into PNGs (files/scripts/look.sh).
// Run from the repo root:  node art/generate.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const OUT = "files/system/usr/share/lupios/art";
mkdirSync(OUT, { recursive: true });

// ---- Palette -----------------------------------------------------------------
const C = {
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

// A soft glow behind the mark: a blurred copy in the accent colour.
const glowFilter = (id, blur) =>
  `<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="${blur}"/></filter>`;
const glowing = (part, opts, { id, opacity }) =>
  `${place(part, { ...opts, fill: C.accent, extra: ` filter="url(#${id})" opacity="${opacity}"` })}\n  ${place(part, opts)}`;

// Icon: app-menu button (start-here), tray widget, About page, Welcome, os-release LOGO.
// The small version, with thicker lines, is installed for the 16-32 px sizes (look.sh).
const icon = (bold) => svg(256, 256, place(MARK, { x: 10, y: (256 - heightAt(MARK, 236)) / 2, width: 236, fill: C.ice, bold }));
writeFileSync(`${OUT}/lupios-logo.svg`, icon(0));
writeFileSync(`${OUT}/lupios-logo-small.svg`, icon(8));

// Emblem: the mark above the name, for the boot screen (Plymouth renders it 260 px tall)
writeFileSync(
  `${OUT}/lupios-emblem.svg`,
  svg(400, 320, `<defs>${glowFilter("glow", 9)}</defs>
  ${glowing(MARK, { x: 105, y: 18, width: 190, fill: C.ice }, { id: "glow", opacity: 0.55 })}
  ${place(WORD, { x: 100, y: 248, width: 200, fill: C.frost })}`),
);

// ---- Seeded random, so the wallpapers come out the same every run ---------------------
function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

// ---- Wallpapers: Night (default) and Lines -------------------------------------------
// A mountain ridge: `peaks` sharp summits with small shoulders and valleys between them.
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

// Both wallpapers are the same night: same stars, moon and mountains. Night paints the
// mountains as shapes; Lines draws them as glowing ice-blue lines, like the logo.
function night({ lines = false } = {}) {
  const W = 3840, H = 2160, rand = rng(4242);
  const stars = Array.from({ length: 420 }, () => {
    const x = Math.round(rand() * W), y = Math.round(rand() * H * 0.62);
    const r = (rand() < 0.08 ? 2.6 : 1.2 + rand() * 1.1).toFixed(1);
    const o = (0.25 + rand() * 0.6).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.text}" opacity="${o}"/>`;
  }).join("");
  const layers = [
    { baseY: 1420, amp: 560, peaks: 5, fill: "#12243A", snow: 0.25, line: 0.75, width: 5 },
    { baseY: 1640, amp: 420, peaks: 7, fill: "#0E1C2E", snow: 0.16, line: 0.45, width: 4 },
    { baseY: 1860, amp: 300, peaks: 9, fill: "#0A1523", snow: 0.1, line: 0.25, width: 3 },
  ].map((l) => {
    const top = ridge(rand, { ...l, W });
    const body = [...top, [W, H], [0, H]];
    const line = top.map((p) => p.join(",")).join(" ");
    if (!lines) {
      return `${poly(body, l.fill)}<polyline points="${line}" fill="none" stroke="${C.ice}" stroke-width="3" opacity="${l.snow}"/>`;
    }
    // dark inside (hides the stars behind the mountain), a blurred glow, then the line itself
    return `${poly(body, "#0A1422")}<polyline points="${line}" fill="none" stroke="${C.accent}" stroke-width="${l.width * 4}" stroke-linejoin="round" opacity="${(l.line * 0.35).toFixed(2)}" filter="url(#lineglow)"/><polyline points="${line}" fill="none" stroke="${C.ice}" stroke-width="${l.width}" stroke-linejoin="round" opacity="${l.line}"/>`;
  }).join("\n  ");
  const moon = lines
    ? `<mask id="crescent"><circle cx="2860" cy="560" r="150" fill="#fff"/><circle cx="2925" cy="520" r="135" fill="#000"/></mask>
  <circle cx="2860" cy="560" r="150" fill="#E6F7FF" mask="url(#crescent)"/>`
    : `<circle cx="2860" cy="560" r="150" fill="#E6F7FF"/>
  <circle cx="2912" cy="530" r="150" fill="#0B1626" opacity="0.18"/>`;
  return svg(W, H, `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#050912"/><stop offset="0.65" stop-color="#0C1A2C"/><stop offset="1" stop-color="#10233A"/>
    </linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="${C.ice}" stop-opacity="${lines ? 0.22 : 0.35}"/><stop offset="1" stop-color="${C.ice}" stop-opacity="0"/></radialGradient>
    <radialGradient id="haze"><stop offset="0" stop-color="${C.accent}" stop-opacity="0.14"/><stop offset="1" stop-color="${C.accent}" stop-opacity="0"/></radialGradient>${lines ? `\n    ${glowFilter("lineglow", 10)}` : ""}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <ellipse cx="${W * 0.55}" cy="1250" rx="2600" ry="520" fill="url(#haze)"/>
  ${stars}
  <circle cx="2860" cy="560" r="520" fill="url(#glow)"/>
  ${moon}
  ${layers}`);
}

// ---- Wallpaper: Emblem (the mark on a dark gradient) ---------------------------------
function emblem() {
  const W = 3840, H = 2160, width = 760, h = heightAt(MARK, width);
  return svg(W, H, `<defs>
    <radialGradient id="bg" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0" stop-color="#132A44"/><stop offset="0.55" stop-color="#0A1422"/><stop offset="1" stop-color="#05080F"/>
    </radialGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="${C.accent}" stop-opacity="0.28"/><stop offset="1" stop-color="${C.accent}" stop-opacity="0"/></radialGradient>
    ${glowFilter("markglow", 26)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${W / 2}" cy="${H * 0.46}" r="760" fill="url(#glow)"/>
  ${glowing(MARK, { x: (W - width) / 2, y: H * 0.46 - h / 2, width, fill: C.ice }, { id: "markglow", opacity: 0.5 })}`);
}

writeFileSync(`${OUT}/wallpaper-night.svg`, night());
writeFileSync(`${OUT}/wallpaper-lines.svg`, night({ lines: true }));
writeFileSync(`${OUT}/wallpaper-emblem.svg`, emblem());

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

// Top of the sidebar (about 190 px wide): the mark above the name
writeFileSync(
  `${ISO}/sidebar-logo.svg`,
  svg(170, 138, `${place(MARK, { x: 43, y: 2, width: 84, fill: C.ice })}
  ${place(WORD, { x: 30, y: 102, width: 110, fill: C.frost })}`),
);

// Behind it: the Lines wallpaper's sky and mountains, tall and narrow. The stylesheet scales it
// to cover the sidebar and pins the bottom, so the mountains always show.
function sidebarBg() {
  const W = 400, H = 1200, rand = rng(707);
  const stars = Array.from({ length: 90 }, () => {
    const x = Math.round(rand() * W), y = Math.round(260 + rand() * 620); // none behind the logo
    const r = (rand() < 0.1 ? 2.2 : 1 + rand() * 0.9).toFixed(1);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.text}" opacity="${(0.2 + rand() * 0.5).toFixed(2)}"/>`;
  }).join("");
  const layers = [
    { baseY: 1030, amp: 190, peaks: 2, line: 0.7 },
    { baseY: 1110, amp: 140, peaks: 3, line: 0.4 },
    { baseY: 1190, amp: 100, peaks: 4, line: 0.22 },
  ].map((l) => {
    const top = ridge(rand, { ...l, W });
    const line = top.map((p) => p.join(",")).join(" ");
    return `${poly([...top, [W, H], [0, H]], "#0A1422")}<polyline points="${line}" fill="none" stroke="${C.ice}" stroke-width="3" stroke-linejoin="round" opacity="${l.line}"/>`;
  }).join("\n  ");
  return svg(W, H, `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#050912"/><stop offset="0.7" stop-color="#0C1A2C"/><stop offset="1" stop-color="#10233A"/>
    </linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="${C.accent}" stop-opacity="0.22"/><stop offset="1" stop-color="${C.accent}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="${W / 2}" cy="130" r="220" fill="url(#glow)"/>
  ${stars}
  ${layers}`);
}
writeFileSync(`${ISO}/sidebar-bg.svg`, sidebarBg());

// The bar at the top of each installer page (Keyboard, Installation Destination, ...)
writeFileSync(
  `${ISO}/topbar-bg.svg`,
  svg(1600, 80, `<defs>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.night}"/><stop offset="1" stop-color="#12243A"/></linearGradient>
  </defs>
  <rect width="1600" height="80" fill="url(#bar)"/>
  <rect y="77" width="1600" height="3" fill="${C.accent}" opacity="0.7"/>`),
);

// ---- Website (website/): logo, favicon and the mountains behind the home page's title -------
// Two versions of the mountains, one per site theme. The front ridge has the page's own
// background colour, so the picture melts into the page below it.
const WEB = "website/src/assets";
mkdirSync(WEB, { recursive: true });
mkdirSync("website/public", { recursive: true });
// The mark (home page) and the mark beside the name (top bar), for the dark and the light theme
for (const [theme, mark, name] of [["dark", C.ice, C.frost], ["light", C.abyss, C.night]]) {
  writeFileSync(`${WEB}/lupios-mark-${theme}.svg`, svg(256, 256, place(MARK, { x: 10, y: (256 - heightAt(MARK, 236)) / 2, width: 236, fill: mark })));
  writeFileSync(`${WEB}/lupios-lockup-${theme}.svg`, svg(318, 100, `${place(MARK, { x: 0, y: 0, width: 101, fill: mark })}
  ${place(WORD, { x: 126, y: 50 - heightAt(WORD, 192) / 2, width: 192, fill: name })}`));
}
// Browser tabs can be light or dark, so the favicon brings its own navy tile
writeFileSync("website/public/favicon.svg", svg(256, 256, `<rect width="256" height="256" rx="56" fill="${C.night}"/>
  ${place(MARK, { x: 34, y: (256 - heightAt(MARK, 188)) / 2, width: 188, fill: C.ice, bold: 8 })}`));

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
  sky: [C.night, "#0C1A2C", "#10233A"], star: C.text, snow: C.ice,
  layers: [
    { baseY: 680, amp: 230, peaks: 4, fill: "#12243A", snow: 0.3 },
    { baseY: 780, amp: 170, peaks: 6, fill: "#0E1C2E", snow: 0.18 },
    { baseY: 870, amp: 100, peaks: 8, fill: C.night, snow: 0.12 },
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

// ---- Preview page: open art/preview.html in a browser to check everything at once -------
const uri = (f, dir = OUT) => `data:image/svg+xml;base64,${Buffer.from(readFileSync(`${dir}/${f}`)).toString("base64")}`;
const logo = uri("lupios-logo.svg"), small = uri("lupios-logo-small.svg");
writeFileSync(
  "art/preview.html",
  `<!doctype html><html><head><meta charset="utf-8"><title>LupiOS art preview</title><style>
body{margin:0;background:#1a1d21;color:#ddd;font:14px sans-serif}
.row{display:flex;gap:24px;align-items:end;padding:16px;flex-wrap:wrap}
.light{background:#eff0f1;color:#222}
.panel{background:#171e29;padding:6px 10px;display:flex;gap:12px;align-items:center}
img.wp{width:760px;display:block}
.ply{background:linear-gradient(#0e1726,#070b14);width:760px;height:428px;display:flex;flex-direction:column;align-items:center;justify-content:center}
.inst{display:flex;width:760px;height:475px;background:#f5f4f2;color:#2e3436}
.inst .side{width:120px;background:#0B1220 url(${uri("sidebar-bg.svg", ISO)}) 50% 100%/cover no-repeat}
.inst .side div{height:100%;background:url(${uri("sidebar-logo.svg", ISO)}) 50% 20px/106px no-repeat}
.inst .main{flex:1;padding:14px 20px}.inst .top{text-align:right;font-size:11px}
.inst .bar{height:34px;margin:12px -20px;background:url(${uri("topbar-bg.svg", ISO)}) 0 0/cover;color:#fff;padding:9px 20px;box-sizing:border-box;font-size:12px}
</style></head><body>
<div class="row"><img src="${logo}" width="256"><img src="${logo}" width="64"><span>icon (48 px and up)</span>
<img src="${small}" width="32"><img src="${small}" width="22"><img src="${small}" width="16"><span>small icon, thicker lines (16-32 px)</span>
<div class="panel"><img src="${small}" width="24"><span>dark panel, 24px</span></div></div>
<div class="row"><div class="ply"><img src="${uri("lupios-emblem.svg")}" height="200">
<div style="margin-top:60px;opacity:.6">boot screen: the password box goes here</div></div></div>
<div class="row"><img class="wp" src="${uri("wallpaper-night.svg")}"><img class="wp" src="${uri("wallpaper-lines.svg")}"><img class="wp" src="${uri("wallpaper-emblem.svg")}">
<span>wallpapers: Night (default), Lines, Emblem</span></div>
<div class="row"><div class="inst"><div class="side"><div></div></div><div class="main"><div class="top">LUPIOS 44 INSTALLATION</div>
<h3>WELCOME TO LUPIOS 44.</h3><div class="bar">INSTALLATION DESTINATION (the bar at the top of each page)</div>
What language would you like to use during the installation process?</div></div>
<span>installer, at 60% size (build-iso.yml)</span></div>
</body></html>
`,
);
console.log("wrote", OUT, "and art/preview.html");
