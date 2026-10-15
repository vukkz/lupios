# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The website (https://lupios.org) mainly speaks to **people who already use Linux and compare
distros**: they know Fedora Atomic, Bazzite, secureblue or Kali by name, and want LupiOS's sharp
differences fast (confirmed by the owner, 2026-10-15). Also served, lower on the page and in the docs:
people leaving Windows who need reassurance (games, apps, nothing breaks), security learners who
would otherwise install Kali as their OS, and gamers who care about security.

The site's job for them: understand what LupiOS is in seconds, trust it enough to try it, pick the
right ISO, and install it.

## Product Purpose

LupiOS is a security-first everyday Linux desktop: Fedora Atomic with KDE Plasma (via Universal Blue,
built with BlueBuild), hardened by default, with Kali's hacking tools in an isolated lab instead of on
the system. Success: people run it as their daily OS and feel safer without fighting it.

## Positioning

**Secure without the hassle** is the lead promise (owner, 2026-10-15). Hardened out of the box, every
setting explained in plain words with its trade-off, and changed with one click (the tray widget) or
one command (`lupi`). The combination no neighbour offers: Kali is a toolbox you boot for a job,
Parrot keeps its tools on a traditional system, secureblue hardens hard but for experts and without
tools, Bazzite is gaming-first. LupiOS is the everyday desktop that is locked down, still easy, can
roll back any update, and carries the hacking tools in a container.

## Operating Context

Visitors arrive from Linux communities, GitHub, or a shared link. They download one of three ISOs from
SourceForge (`lupios.iso` 4.5 GB for AMD/Intel/older NVIDIA/VMs, `lupios-nvidia.iso` 5.4 GB for GTX 16xx/
RTX 20xx and newer, `lupios-online.iso` 1.2 GB that downloads the system during setup), write it to a
USB stick, install (about 30 minutes), then meet LupiOS Welcome and the `lupi` command. People already
on Fedora Atomic can rebase instead. Docs live on the same site: install guide, dual-boot guide, the
`lupi` command, Security (SECURITY.md), What's new, FAQ.

## Capabilities and Constraints

- Hardening: firewall blocks incoming, kernel sysctls and boot arguments, blocked rare modules, signed
  images (cosign), SELinux enforcing; USBGuard and an outgoing guard (OpenSnitch) opt-in.
- Security levels **sheep** (everyday default) and **wolf** (maximum caution); network trust (home/public,
  public = invisible and quiet, random MAC); Game Mode (Steam ports, updates paused).
- Atomic, signed updates with rollback to the previous version in the boot menu.
- Lupi Lab (`lupi lab`, Kali tools in a distrobox) and the strict lab (`lupi lab strict`, can't see your files).
- `lupi` command, tray widget, Welcome app; apps via Flathub (`lupi install`), CLI tools from Arch in a box.
- Every build is booted and checked against every SECURITY.md promise before anyone updates to it.
- Site stack: Astro Starlight (website/), GitHub Pages, custom domain lupios.org. Docs pages stay Starlight.
- Status: **early release** (owner, 2026-10-15): it works and installs, but it's young; say so openly and
  invite testers. Fedora 45 rebase and real-hardware testing are still ahead.

## Brand Commitments

- Name **LupiOS** (wolf, Latin *lupus*), the command `lupi`, levels sheep/wolf.
- Logo: the owner's wolf mark and wordmark (art/logo/), drawn by art/generate.mjs. Night identity: ice-blue
  mark on deep navy, stars, mountain ridges (wallpapers, installer, website hero, link preview).
- Voice: plain language, honest about trade-offs, no hype; every security claim backed by SECURITY.md.
- Reference the owner gave for the website (2026-10-15): Bazzite's site (https://bazzite.gg), as an example
  of a clean site that catches the eye. A reference for impact and clarity, not a look to copy.

## Evidence on Hand

- One real desktop screenshot: website/src/assets/screenshots/desktop.png (Lines wallpaper, Konsole with
  fastfetch, the LupiOS panel open). More can be captured from the LupiOS VM.
- Real, linkable proof: SECURITY.md (every setting and trade-off), the boot test on every build
  (tests/boot/), signed images and cosign.pub, open source (Apache-2.0), What's new page.
- **No users, testimonials, press, download counts or benchmarks exist yet. Never invent them.**

## Product Principles

1. Secure by default, never locked: the user's choice always wins, and every default can be changed.
2. Show the trade-off: no security claim without saying what it costs and where it's documented.
3. Plain words for everyone: a learner should understand it; an expert should find the details.
4. Prove it, don't promise it: point at the boot test, the signatures, the source.
5. Honest about being young: early release, open about what's still untested.
