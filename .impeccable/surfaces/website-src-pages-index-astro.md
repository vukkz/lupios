---
version: 1
slug: "website-src-pages-index-astro"
primary_target: "website/src/pages/index.astro"
related_targets: ["website/src/content/docs/download.mdx","website/src/components/Downloads.astro"]
---

# Home page (lupios.org/)

Scope: the home page, a custom Astro page outside Starlight (docs stay Starlight). The download page
keeps its Starlight layout but uses the same identification key. Mode: Persuade.

Audience and job: Linux users comparing distros. Within one viewport they must know what LupiOS is,
believe it, and reach the right ISO. Proof on hand: the real desktop screenshot (more from the VM),
SECURITY.md, the boot test on every build, signed images, open source. No testimonials or numbers.
Constraints: the night brand (navy, ice blue, wolf mark, mountains); no hacker clichés, gamer neon,
corporate security imagery or walls of text; status is early release.

Memorable moment: the sheep / wolf switch re-inks the plate and shows exactly what tightens.

Unresolved: self-hosted font packages (owner approval), new screenshots from the VM.

## Direction contract

THESIS: LupiOS as a species in a night field guide: field marks on the real desktop, two
temperaments, similar species, and a key to your ISO. Refuses the gradient hero over an icon-card grid.

OWN-WORLD: Total navy plate pages, ice-blue hairlines and numbered leader-line callouts, frost
names in Arimo (the logo's Helvetica letter shapes) with italic Latin, bold labels, one ochre status
tag. No cards, no glow.

STORY: A distro hopper sees what LupiOS is, believes it from the annotated desktop and honest
comparisons, keys out the right ISO and downloads it.

FIRST VIEWPORT: Left third: LupiOS, Lupus custos, "secure without the hassle", status tag, Download
and the key. Right two thirds: the desktop plate, five numbered field marks on the panel. Ridge
linework along the foot.

FORM: Night field guide, seventh on my ordered list, seed cfb0dc7b.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Refinement, 2026-10-19 (owner)

The type didn't match the logo (Alegreya next to a Helvetica wordmark), the 4fr/8fr accounts left the
heading column empty, Download jumped to the foot of the page, and nothing moved but the first viewport.
Chosen: Arimo throughout (over Inter Tight and Geist), the heading and intro on top with the account
across the full width and side notes beside what they explain, the key on its own page
(`src/pages/download.astro`, same world, framed with the home page by `src/layouts/GuideLayout.astro`),
and "ink being drawn": lines rule themselves in as accounts come into view, smooth in-page scrolling,
crossfades between pages. DESIGN.md records the result.
