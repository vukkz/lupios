// Writes the "What's new" page from git history, before every build (the page is git-ignored).
// The site is published from `main`, so it lists what reached the stable channel: the first line
// of each commit message, newest first, grouped by day. Internal commits are left out.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const REPO = "https://github.com/vukkz/lupios";
const DAYS = 90;
const internal = /^(CLAUDE\.md|chore\(|Merge )/;

let log = "";
try {
  // %x09 = tab. Merges and Dependabot's own commits aren't changes anyone would notice.
  log = execFileSync("git", ["log", "--no-merges", `--since=${DAYS} days ago`, "--date=short",
    "--format=%h%x09%ad%x09%an%x09%s", "HEAD"], { encoding: "utf8" });
} catch {
  console.warn("changes: no git history here, the page stays empty");
}

const byDay = new Map();
for (const line of log.split("\n").filter(Boolean)) {
  const [hash, day, author, subject] = line.split("\t");
  if (author.startsWith("dependabot") || internal.test(subject)) continue;
  if (!byDay.has(day)) byDay.set(day, []);
  // .md, not .mdx: only "<" needs escaping so it isn't read as HTML
  byDay.get(day).push(`- ${subject.replaceAll("<", "&lt;")} ([${hash}](${REPO}/commit/${hash}))`);
}

const date = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const sections = [...byDay].map(([day, items]) => `## ${date(day)}\n\n${items.join("\n")}`);

const page = `---
title: "What's new"
description: "What changed in LupiOS, newest first."
editUrl: false
---
<!-- Made from git history by website/scripts/changes.mjs. -->

LupiOS's own changes from the last ${DAYS} days, newest first. Your PC gets each one with the
next update after its date: automatically, or right away with \`lupi update\` and a restart.
Fedora's security and bug fixes arrive every day on top of these, without being listed here.

${sections.join("\n\n") || "Nothing yet."}
`;
writeFileSync(new URL("../src/content/docs/changes.md", import.meta.url), page);
console.log(`changes: ${[...byDay.values()].flat().length} changes on ${byDay.size} days`);
