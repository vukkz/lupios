// Copies the repo's own docs into the site, so every text has one home: SECURITY.md and
// docs/install.md stay the originals (GitHub shows them, and the OS points to them), and the site
// shows the same words. Runs before every `npm run dev` and `npm run build`; the copies are git-ignored.
import { readFileSync, writeFileSync } from "node:fs";
import { posix } from "node:path";

const REPO = "https://github.com/vukkz/lupios";
const pages = [
  {
    from: "docs/install.md",
    to: "install",
    title: "Install LupiOS",
    description: "Put LupiOS on a USB stick and install it, step by step. About 30 minutes.",
  },
  {
    from: "SECURITY.md",
    to: "security",
    title: "Security",
    description: "Every protection LupiOS adds, what it guards against, what it can break, and how to undo it.",
  },
];
const sitePage = Object.fromEntries(pages.map((p) => [p.from, p.to]));

for (const page of pages) {
  let text = readFileSync(new URL(`../../${page.from}`, import.meta.url), "utf8");
  text = text.replace(/^# .*\n+/, ""); // the site shows its own title instead

  // Headings in SECURITY.md name the file behind each setting ("## Firewall: `files/...`"). Handy on
  // GitHub, but far too long for the site's table of contents, so the file moves under the heading.
  text = text.replace(/^(#{2,3}) (.+?): `([^`]*\/[^`]*)`$/gm, (_, level, name, file) =>
    `${level} ${name}\n\nFile: [\`${file}\`](${REPO}/blob/main/${file})`);

  // Links are relative to the file in the repo. On the site, links to a synced doc go to its page,
  // and links to anything else in the repo go to GitHub.
  text = text.replace(/\]\((?!https?:|#|mailto:)([^)#\s]+)(#[^)\s]*)?\)/g, (_, target, anchor = "") => {
    const path = posix.normalize(posix.join(posix.dirname(page.from), target));
    return sitePage[path] ? `](../${sitePage[path]}/${anchor})` : `](${REPO}/blob/main/${path}${anchor})`;
  });

  const front = [
    "---",
    `title: ${JSON.stringify(page.title)}`,
    `description: ${JSON.stringify(page.description)}`,
    `editUrl: ${REPO}/edit/main/${page.from}`,
    "---",
    `<!-- Copied from ${page.from} by website/scripts/sync.mjs. Edit that file, not this one. -->`,
    "",
    "",
  ].join("\n");
  writeFileSync(new URL(`../src/content/docs/${page.to}.md`, import.meta.url), front + text);
}
console.log("synced", pages.map((p) => p.from).join(", "));
