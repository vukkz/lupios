---
name: LupiOS
description: A Linux desktop that's secure without the hassle, presented as a species in a field guide printed for night use.
colors:
  night: "#0b1220"
  ink: "#ddf4ff"
  dim: "#a3bbcc"
  frost: "#cff3ff"
  ice: "#8be0ff"
  ochre: "#d9b26a"
  hairline: "rgb(139 224 255 / 0.2)"
  hairline-strong: "rgb(139 224 255 / 0.45)"
typography:
  display:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "clamp(3.75rem, 7.5vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "clamp(2.1rem, 3.6vw, 2.9rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "1.3rem"
    fontWeight: 700
    lineHeight: 1.25
  name-latin:
    fontFamily: "Alegreya, Georgia, serif"
    fontSize: "1.3rem"
    fontWeight: 500
    lineHeight: 1.25
  body:
    fontFamily: "Alegreya Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  body-small:
    fontFamily: "Alegreya Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Alegreya Sans SC, Alegreya Sans, system-ui, sans-serif"
    fontSize: "0.98rem"
    fontWeight: 500
    letterSpacing: "0.04em"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.88em"
    fontWeight: 400
rounded:
  sharp: "2px"
  mark: "50%"
spacing:
  gutter: "clamp(1rem, 4vw, 3rem)"
  measure: "min(78rem, 100% - 2 * clamp(1rem, 4vw, 3rem))"
  section: "clamp(5rem, 9vw, 7.5rem)"
  column: "clamp(2rem, 4vw, 4.5rem)"
  stack: "1.75rem"
  row: "0.75rem"
components:
  button-primary:
    backgroundColor: "{colors.ice}"
    textColor: "{colors.night}"
    rounded: "{rounded.sharp}"
    padding: "0.65rem 1.15rem"
  button-primary-hover:
    backgroundColor: "{colors.frost}"
    textColor: "{colors.night}"
  link-quiet:
    textColor: "{colors.ink}"
  nav-link:
    textColor: "{colors.dim}"
    typography: "{typography.label}"
  nav-link-hover:
    textColor: "{colors.frost}"
  tag-status:
    textColor: "{colors.ochre}"
    typography: "{typography.label}"
    padding: "0.05rem 0.55rem 0.15rem"
  field-mark:
    backgroundColor: "{colors.night}"
    textColor: "{colors.frost}"
    rounded: "{rounded.mark}"
    size: "1.85rem"
  switch-option:
    textColor: "{colors.dim}"
    padding: "0.6rem 1.25rem 0.7rem"
  switch-option-checked:
    backgroundColor: "{colors.ice}"
    textColor: "{colors.night}"
  switch-option-checked-wolf:
    backgroundColor: "{colors.ochre}"
    textColor: "{colors.night}"
---

# Design System: LupiOS

## Overview

**Creative North Star: "The Night Field Guide"**

LupiOS is shown as a species in a field guide printed for night use: total navy plates, ice-blue hairlines, numbered leader-line callouts on real photographs (VM screenshots), frost serif names with italic Latin, and small-caps labels. It continues the OS's own night identity (ice-blue wolf mark on deep navy, mountain ridges, the palette in `art/generate.mjs`), so the website, wallpapers, installer and link preview read as one brand.

Hierarchy comes from type and ink, never from boxes or light. Content is set as "species accounts": a heading column on the left, the account on the right, each separated by one hairline rule. Comparisons are ruled tables, explanations are ruled heading-and-text grids, and evidence is a plate with numbered marks. Density is that of a reference book: generous section breaks, tight ruled rows inside.

The world is dark only by design: the brand is night. The home page sets `color-scheme: dark` on its root and offers no light variant. The docs pages stay on Starlight's own theme (lupios.css) and are outside this world, except where they host the shared identification key, which falls back to Starlight's colours there.

**Key Characteristics:**
- Navy plate background, edge to edge, with ice hairlines as the only structure.
- Alegreya (display, names, italic Latin) over Alegreya Sans (body) and Alegreya Sans SC (labels), JetBrains Mono for commands.
- One ochre, reserved for what the reader is pointed at.
- Real screenshots as plates, annotated with numbered circular field marks and leader lines.
- Flat: no cards, no glow, no gradients.
- One authored motion moment; everything else is a quiet state transition.

## Colors

A near-monochrome night palette of navy and ice, with a single warm ochre held back for pointing.

### Primary
- **Glacier Ice** (ice): links, the primary button fill, leader lines and field-mark rings, the strict-lab command names, the Habitat trait column, the default (sheep) accent. It is the page's working colour.

### Tertiary
- **Lantern Ochre** (ochre): the one warm colour. Used only for the status tag, focus rings, the wolf state of the Temperament switch and the values wolf changes, the key's chosen specimen (`:target`), and LupiOS's own row in the Similar species table.

### Neutral
- **Night Plate** (night): every background, and the text colour on ice or ochre fills. Also the `theme-color`.
- **Frost** (frost): headings, species names, field-mark numerals, button hover fill.
- **Snow Ink** (ink): running emphasis, `<b>` inside dim text, table row heads, quiet links.
- **Lichen Dim** (dim): body copy, lede, section descriptions, legends, table values, nav links. Faded further only in the wolf state's sheep column (mixed 72% dim into night, still 5.4:1).
- **Hairline** (hairline): section rules, table row rules, masthead and colophon rules, the main plate's border.
- **Strong Hairline** (hairline-strong): rules above grid entries, borders of the inset and terminal plates, the scrollbar thumb.

### Named Rules
**The Pointed-At Rule.** Ochre marks only what the reader is being pointed at: a status, a focus, a chosen state, the answer to the key, LupiOS among its neighbours. Never decoration, never a second brand colour, never more than one pointed-at thing per view in normal reading.

**The Ink-Not-Box Rule.** Emphasis is done by moving text up the ink ladder (dim, ink, frost, ice, ochre), not by putting it in a filled container.

## Typography

**Display Font:** Alegreya (with Georgia, serif), weights 500, 700 and 500 italic
**Body Font:** Alegreya Sans (with system-ui, sans-serif), weights 400, 500, 700
**Label Font:** Alegreya Sans SC 500 (small caps, with Alegreya Sans fallback)
**Mono Font:** JetBrains Mono 400

All self-hosted through @fontsource, Latin subset only.

**Character:** A humanist book serif and its own sans sibling: the pairing of a printed natural-history guide, with small caps doing the work of a guide's plate labels.

### Hierarchy
- **Display**: the species name (LupiOS) only, frost, balanced.
- **Headline**: section heads of each account (Temperament, Habitat, Den...), frost.
- **Title**: entry heads in ruled grids, switch option names, Habitat column heads (larger, 1.6rem), specimen names in the key (1.45rem).
- **Name, Latin italic**: the binomial (*Lupus custos*, 1.3rem, italic set in ice), neighbour species names in the comparison table, plate credits (0.95rem). Italic Alegreya is the voice of names and provenance.
- **Body**: running text at 1.125rem/1.6; ledes cap at 44ch, section descriptions at 34ch, asides at 66ch. Secondary text and tables at 1rem.
- **Label**: table column heads, the Habitat trait column, nav links (1.05rem, 0.03em), the status tag (0.06em), field-mark numerals. Small caps from the SC face, never faked with uppercase transforms.
- **Code**: commands inline, in frost; command names in grid entries at 1.15rem in ice.

### Named Rules
**The Real Small Caps Rule.** Labels use the Alegreya Sans SC face with light tracking (0.03 to 0.06em). No `text-transform: uppercase`, no synthesized caps.

**The Italic Is a Name Rule.** Alegreya italic is reserved for names (species, Latin) and photo credits.

## Layout

Content sits in one measure, `min(78rem, 100% - 2 × gutter)`, centred. The first viewport is a two-column grid (5fr / 8fr): the account on the left (name, binomial, promise, lede, status, actions), the desktop plate on the right, with a generated ridge linework image bleeding full-width along the foot behind it.

Every following section is a species account: a 4fr heading column and an 8fr body column, column gap clamp(2rem, 4vw, 4.5rem), separated from the previous section by clamp(5rem, 9vw, 7.5rem) of space and one hairline with 2rem below it. Inside the body, blocks stack at 1.75rem. Ruled grids use `auto-fit` columns with a 15rem (or 19rem) minimum.

Breakpoints: at 64rem the first viewport stacks to one column; at 52rem accounts stack, the masthead nav hides (the Download button stays), the panel inset leaves the plate and sits under it, the Den terminal plate is replaced by a typed transcript, and comparison tables become one labelled block per row; at 40rem the key's dotted leaders drop and the destination wraps under the text.

## Elevation & Depth

The system is flat. Depth comes from overlap and ink, not light: plates sit on the night background with a hairline border, and the only layering is the panel inset overlapping the main plate's lower left, as a field guide's detail inset does. There are no glows, no gradients, no tonal surface ladder.

### Named Rules
**The Flat Plate Rule.** Surfaces are the night plate itself. A thing is set apart by a hairline, never by a fill or a glow.

## Shapes

Rectilinear and printed. Corners are sharp: buttons and focus rings carry a near-square 2px (focus 1px), plates and tables none. The only round form is the field mark: a circle (1.85rem, 1.5rem in legends) with an ice ring on night, joined to its subject by a short ice tick or a leader line drawn with non-scaling 1.25px strokes. The key's dotted leaders (2px dotted, dim at 55%) are the other recurring line form.

## Components

### Buttons
Plain and solid, like an ink stamp.
- **Shape:** near-square (2px).
- **Primary:** ice fill, night text, Alegreya Sans 700 at 1rem, padding 0.65rem 1.15rem. One per region: the masthead Download and the first viewport's Download, plus the key's per-ISO download buttons.
- **Hover / Focus:** fill eases to frost over 0.25s; focus is the ochre 2px outline offset 3px.
- **Quiet links:** secondary actions are text links in ink (weight 500), underlined at 1px, offset 0.22em. There is no ghost or outline button.

### Status tag
The single ochre mark of the first viewport: a 1px ochre outline around ochre small-caps text (0.95rem, 0.06em), followed inline by the plain-language status in dim. Not a chip system: one per page.

### Navigation
Masthead: logo lockup left, small-caps nav links in dim to the right (hover frost), Download button at the end, one hairline below. Colophon repeats the nav in the same style above a hairline. On narrow screens the masthead keeps only the logo and Download.

### Plate with field marks (signature)
A real VM screenshot with a hairline border, numbered circular marks placed by percentage alongside it, an SVG of ice leader lines, a numbered legend below (number, ink bold term, dim explanation) and an italic credit stating provenance ("Photographed in a virtual machine").

### Temperament switch (signature)
A pure-CSS radio pair (Sheep / Wolf) drawn as a segmented outline in the current accent. The checked option fills with the accent and turns its text night. Choosing Wolf switches the section's accent from ice to ochre: the switch border, the wolf column head and every changed value re-ink in ochre (bold), and the sheep column fades. Transitions 0.45 to 0.5s.

### Ruled tables
Comparison tables (Temperament, Habitat, Similar species) are collapsed, hairline-ruled rows with small-caps heads. Habitat mirrors Home (right-aligned, dim) and Public (ink) around a centred ice trait column. Similar species names neighbours in italic frost; LupiOS's row is ruled above and below in ochre with its name upright ochre bold.

### Ruled grid entries
Behaviour, Field notes and the Den's two labs: a heading (title type, or a command in ice mono) over dim text, each entry under a strong hairline.

### Identification key (signature, shared)
Numbered couplets: two leads per couplet, each a sentence, a dotted leader and a bold ice destination ("go to 2" or a specimen). Specimens follow as columns under 2px rules; following the key to one (`:target`) turns its rule and name ochre. It reads `--guide-*` colours on the home page and falls back to Starlight's colours on the docs download page, so it works in both themes.

### Motion
One authored moment: on load, the plate's leader lines reveal right to left with a clip-path (1.1s, 0.25s delay), then the five marks land in sequence (0.6s each, 80ms stagger, from 60% scale). Only under `prefers-reduced-motion: no-preference`; reduced motion removes every animation and transition. Easing everywhere is a soft exponential out.

## Do's and Don'ts

### Do:
- **Do** keep every page of this world on the night plate (night) edge to edge, dark only.
- **Do** structure with hairlines (hairline between sections and rows, hairline-strong above grid entries and around inset plates).
- **Do** set content as accounts: heading column 4fr left, body 8fr right.
- **Do** prove features with real screenshots as plates, annotated with numbered circular field marks, a legend and a provenance credit.
- **Do** hold ochre for the pointed-at thing: status, focus ring, chosen state, key answer, LupiOS's own row.
- **Do** use the Alegreya Sans SC face for labels and Alegreya italic for names and Latin.
- **Do** make comparison tables collapse to labelled blocks per row below 52rem.

### Don't:
- **Don't** wrap content in cards: no filled or shadowed boxes around text groups. Bordered plates around photographs and the terminal transcript are the world's own material and stay.
- **Don't** add glow, gradients or a gradient hero over an icon-card grid.
- **Don't** introduce a second warm accent or use ochre decoratively.
- **Don't** fake small caps with uppercase transforms or wide tracking.
- **Don't** add motion beyond the plate's line draw and mark landing; state changes only ease colour.
- **Don't** invent screenshots, users, numbers or testimonials for plates or marks.
