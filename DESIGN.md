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
    fontFamily: "Arimo, Helvetica Neue, Helvetica, Arial, Liberation Sans, sans-serif"
    fontSize: "clamp(4rem, 8vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Arimo, Helvetica Neue, Helvetica, Arial, Liberation Sans, sans-serif"
    fontSize: "clamp(2.25rem, 4.4vw, 3.4rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Arimo, Helvetica Neue, Helvetica, Arial, Liberation Sans, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  name-latin:
    fontFamily: "Arimo, Helvetica Neue, Helvetica, Arial, Liberation Sans, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 400
    fontStyle: "italic"
    lineHeight: 1.3
  body:
    fontFamily: "Arimo, Helvetica Neue, Helvetica, Arial, Liberation Sans, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  body-small:
    fontFamily: "Arimo, Helvetica Neue, Helvetica, Arial, Liberation Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Arimo, Helvetica Neue, Helvetica, Arial, Liberation Sans, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 700
    letterSpacing: "0.01em"
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
  section: "clamp(4.5rem, 8vw, 6.5rem)"
  column: "clamp(2rem, 4vw, 4rem)"
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
    typography: "{typography.body}"
  nav-link-hover:
    textColor: "{colors.frost}"
  tag-status:
    textColor: "{colors.ochre}"
    typography: "{typography.label}"
    padding: "0.1rem 0.5rem"
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

LupiOS is shown as a species in a field guide printed for night use: total navy plates, ice-blue hairlines, numbered leader-line callouts on real photographs (VM screenshots), names in the logo's own Helvetica letter shapes (Arimo) with italic Latin, and bold labels. It continues the OS's own night identity (ice-blue wolf mark on deep navy, mountain ridges, the palette in `art/generate.mjs`), so the website, wallpapers, installer and link preview read as one brand.

Hierarchy comes from type and ink, never from boxes or light. Content is set as "species accounts": the heading and its intro on top, the account across the full width below, each account opened by one hairline rule; side notes sit beside the table, plate or key they explain. Comparisons are ruled tables, explanations are ruled heading-and-text grids, and evidence is a plate with numbered marks. Density is that of a reference book: generous section breaks, tight ruled rows inside.

The world is dark only by design: the brand is night. The field-guide pages (the home page and the download page, framed by `src/layouts/GuideLayout.astro`) set `color-scheme: dark` on their root and offer no light variant. The docs pages stay on Starlight's own theme (lupios.css), outside this world, but share its typeface (Arimo, tight headings) and its page-to-page crossfade, so moving between them feels like one site.

**Key Characteristics:**
- Navy plate background, edge to edge, with ice hairlines as the only structure.
- Arimo throughout (the Helvetica letter shapes of the logo): bold display set like the wordmark, regular body, italic for names. JetBrains Mono for commands.
- One ochre, reserved for what the reader is pointed at.
- Real screenshots as plates, annotated with numbered circular field marks and leader lines.
- Flat: no cards, no glow, no gradients.
- Motion is ink being drawn: the first viewport draws itself on load, and each account rules its lines in as it comes into view.

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

**Display, body and label font:** Arimo (with Helvetica Neue, Helvetica, Arial, Liberation Sans), weights 400, 700 and 400 italic
**Mono Font:** JetBrains Mono 400

All self-hosted through @fontsource, Latin subset only (about 11 KB per weight).

**Character:** One neo-grotesque, because the logo is one: the wordmark is Helvetica (bold "Lupi", regular "OS"), and Arimo carries the same letter shapes in a free face hinted for screens. Hierarchy comes from size, weight and tracking, not from a second family. The owner chose it on 2026-10-19 over Inter Tight and Geist, after the first world's book serif (Alegreya) read as a different brand from the logo.

### Hierarchy
- **Display**: the species name only, set like the wordmark: "Lupi" 700, "OS" 400, tracking -0.04em, frost. The download page's title uses the same face up to 5rem.
- **Headline**: section heads (Temperament, Habitat, Den... and the download page's), 700 up to 3.4rem at -0.035em, frost; up to 2.75rem where the head shares the row with commands.
- **Title**: entry heads in ruled grids and switch option names (1.2rem 700, -0.015em), Habitat column heads (1.45rem), specimen names in the key (1.45rem).
- **Name, Latin italic**: the binomial (*Lupus custos*, 1.25rem, italic set in ice), neighbour species names in the comparison table (1.15rem, frost), plate credits (0.92rem).
- **Body**: running text at 1.0625rem/1.6; section intros 1.125rem capped at 54ch; ledes at 46ch (56ch on the download page); asides at 66ch. Secondary text and tables at 1rem.
- **Label**: table column heads, command labels and the phone layout's row labels: 700 at 0.85 to 0.9rem, dim, sentence case; the Habitat trait column in ice. Nav links are body type at 1rem in dim.
- **Code**: commands inline, in frost; command names in grid entries at 1.1rem in ice; command plates at 0.9rem.

### Named Rules
**The Wordmark Rule.** Type follows the logo: one neo-grotesque (Arimo) for everything but code, headings tight (-0.015 to -0.04em) like the wordmark, and the name in the first viewport set exactly as the logo is (bold "Lupi", regular "OS"). No second display family.

**The One Stamp Rule.** Capitals appear once per page: the ochre status tag (700, 0.78rem, 0.08em). Every other label is bold sentence case.

**The Italic Is a Name Rule.** Italic is reserved for names (species, Latin) and photo credits.

## Layout

Content sits in one measure, `min(78rem, 100% - 2 × gutter)`, centred. The first viewport is a two-column grid (5fr / 8fr): the account on the left (name, binomial, promise, lede, status, actions), the desktop plate on the right, with a generated ridge linework image bleeding full-width along the foot behind it.

Every following section is a species account: the heading and its intro on top, then the account across the full measure. Accounts are separated by clamp(4.5rem, 8vw, 6.5rem) of space and one hairline with clamp(1.75rem, 3vw, 2.25rem) below it; the first account after a page's head sits closer (clamp(2.5rem, 5vw, 4rem)), because the ridge already closes the head. Where an account has companion text, the body splits so neither side is empty: Temperament 8fr table / 4fr notes, Den 7fr plate / 5fr labs and note, the download key 8fr / 4fr notes. On the download page, explanation-and-command accounts split 5fr head / 7fr commands. Column gap clamp(2rem, 4vw, 4rem). Inside a body, blocks stack at 1.75rem. Ruled grids use `auto-fit` columns with a 15rem minimum (Behaviour and Get LupiOS three across, Field notes four).

The download page opens with a page head instead of the specimen page: the title, a lede and the same ridge along its foot.

Breakpoints: at 64rem the first viewport stacks to one column; at 52rem every split body stacks (notes after their table, the labs after the plate, commands after their explanation), the masthead nav hides (the Download button stays), the panel inset leaves the plate and sits under it, the Den terminal plate is replaced by a typed transcript, and comparison tables become one labelled block per row; at 40rem the key's dotted leaders drop and the destination wraps under the text.

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
- **Primary:** ice fill, night text, Arimo 700 at 1rem, padding 0.65rem 1.15rem. One per region: the masthead Download, the first viewport's Download, Get LupiOS's "Choose your download", the download page's "Next: install it", plus the key's per-ISO download buttons.
- **Hover / Focus:** fill eases to frost over 0.25s; focus is the ochre 2px outline offset 3px.
- **Quiet links:** secondary actions are text links in ink (regular weight), underlined at 1px, offset 0.22em. There is no ghost or outline button; the command plates' Copy is a quiet text button in ice.

### Status tag
The single ochre mark of the first viewport: a 1px ochre outline around ochre capitals (Arimo 700, 0.78rem, 0.08em: the page's only capitals), followed inline by the plain-language status in dim. Not a chip system: one per page.

### Navigation
Masthead (in GuideLayout, shared by both field-guide pages): logo lockup left, nav links in dim to the right (Arimo 1rem, hover frost), the Download button at the end (to /download/, `aria-current` there), one hairline below. It keeps its place while pages crossfade (`view-transition-name: masthead`). Colophon repeats the nav in the same style above a hairline. On narrow screens the masthead keeps only the logo and Download.

### Plate with field marks (signature)
A real VM screenshot with a hairline border, numbered circular marks placed by percentage alongside it, an SVG of ice leader lines, a numbered legend below (number, ink bold term, dim explanation) and an italic credit stating provenance ("Photographed in a virtual machine").

### Temperament switch (signature)
A pure-CSS radio pair (Sheep / Wolf) drawn as a segmented outline in the current accent. The checked option fills with the accent and turns its text night. Choosing Wolf switches the section's accent from ice to ochre: the switch border, the wolf column head and every changed value re-ink in ochre (bold), and the sheep column fades. Transitions 0.45 to 0.5s.

### Ruled tables
Comparison tables (Temperament, Habitat, Similar species) are collapsed, hairline-ruled rows with bold sentence-case heads. Each body row's rule is a 1px line painted under the row (a background, not a border), so it can be drawn in. Habitat mirrors Home (right-aligned, dim) and Public (ink) around a centred ice trait column. Similar species names neighbours in italic frost; LupiOS's row is ruled above and below in ochre with its name upright ochre bold.

### Ruled grid entries
Behaviour, Get LupiOS (the three installers, each name linking to its specimen on the download page, its size in ink bold), Field notes, What you need, and the Den's two labs: a heading (title type, or a command in ice mono) over dim text, each entry under a strong hairline.

### Side notes
Ruled paragraphs beside the table, plate or key they explain (Temperament, the download key): a strong hairline above each, the lead in ink bold, the rest dim at 1rem.

### Command plate
A command to type or paste (`src/components/Command.astro`): an optional bold dim label above ("Windows PowerShell"), then a strong-hairline box with no fill holding the command in frost mono. A long command scrolls sideways inside its own space; a quiet Copy text button keeps its place at the right edge, shown only where the browser allows copying, and says "Copied" for two seconds. Numbered steps (the Fedora Atomic switch) use the field-mark circle as their numeral.

### Identification key (signature, shared)
Numbered couplets: two leads per couplet, each a sentence, a dotted leader and a bold ice destination ("go to 2" or a specimen). Specimens follow as columns under 2px rules; following the key to one (`:target`) turns its rule and name ochre. It lives on the download page and reads its `--guide-*` colours (it still falls back to Starlight's colours anywhere else). Hovering or focusing a lead runs its dotted leader out to the answer in ice (clip-path, 0.5s).

### Motion
Ink being drawn. On load, the first viewport draws itself: the ridge reveals left to right (clip-path, 1.8s), the plate's leader lines from the panel (1.1s, 0.25s delay), then the five marks land (0.6s each, 80ms stagger, from 60% scale). Further down, each account rules its lines in once it scrolls into view (`data-draw`; GuideLayout's IntersectionObserver adds `.drawn`): the hairline above it (scaleX from the left, 1.1s), its table rows one after another (0.8s, 70ms stagger, capped at 7 rows), its entry and note rules (0.9s, 90ms stagger), and the Den's marks. Only lines and marks ever start hidden, never text, and only when the page set `.motion` before the first paint (motion wanted, and IntersectionObserver available). In-page links scroll smoothly, and moving between pages, field guide and docs alike, crossfades through a cross-document view transition. With reduced motion there is no `.motion`, no animation, no smooth scrolling and no view transition; colour transitions stay, because they carry state. Easing everywhere is a soft exponential out.

## Do's and Don'ts

### Do:
- **Do** keep every page of this world on the night plate (night) edge to edge, dark only.
- **Do** structure with hairlines (hairline between sections and rows, hairline-strong above grid entries and around inset plates).
- **Do** set content as accounts: the heading and intro on top, the account across the full width, side notes beside what they explain.
- **Do** prove features with real screenshots as plates, annotated with numbered circular field marks, a legend and a provenance credit.
- **Do** hold ochre for the pointed-at thing: status, focus ring, chosen state, key answer, LupiOS's own row.
- **Do** use Arimo for everything but code, with tight headings and LupiOS set like the wordmark; italic only for names and Latin.
- **Do** make comparison tables collapse to labelled blocks per row below 52rem.

### Don't:
- **Don't** wrap content in cards: no filled or shadowed boxes around text groups. Bordered plates around photographs and the terminal transcript are the world's own material and stay.
- **Don't** add glow, gradients or a gradient hero over an icon-card grid.
- **Don't** introduce a second warm accent or use ochre decoratively.
- **Don't** bring back a second display family, or uppercase labels beyond the one status tag.
- **Don't** leave a column empty for symmetry: an account's side column holds real notes or nothing.
- **Don't** add motion that isn't a line being drawn or a mark landing (no fade-and-rise sections, no parallax); state changes only ease colour.
- **Don't** invent screenshots, users, numbers or testimonials for plates or marks.
