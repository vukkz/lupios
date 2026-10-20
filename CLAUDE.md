# LupiOS: notes for Claude

A security-first daily-driver Linux distro: Fedora Atomic 44 (KDE, via Universal Blue) built with
BlueBuild. Solo project by vukkz, who is learning as we go: explain things in plain language,
and make sure they understand the *why* (see README.md, SECURITY.md, docs/install.md).

## Workflow rules
- **Ask before every commit or push.** The owner says "push" when ready.
- **New work goes to the `testing` branch first** (image tag `br-testing-<Fedora>`; the testing channel
  follows the tag `testing`, which build.yml's `channel-tag` job moves there only after both boot tests
  passed). Promote to stable only when the owner approves: `git push origin testing:main` (tag `latest`).
- After pushing, watch the builds with `gh run list/watch -R vukkz/lupios` and read the build log
  for evidence that the change landed, not just a green tick. Image builds take about 15 min (longer with
  rechunking), then the **Boot test** job (~15 min). Only promote a `testing` build whose boot test passed.
- **Don't push to a branch while a build on that branch is running:** `build.yml` cancels in-progress
  builds on the same ref (`cancel-in-progress`), which also breaks anything waiting for that build.
- A ruleset ("Protect main and testing", 2026-10-11) blocks force-pushes and deleting either branch, so
  every push must be a fast-forward (promoting `testing:main` always is). Questions go to Discussions (Q&A).
- A new branch created identical to another skips `paths-ignore` workflows. Start it with
  `gh workflow run build.yml --ref <branch>`.
- The `gh` token lacks the `workflow` scope: merging a PR that touches `.github/workflows/*` fails once the
  base has moved. Merge locally with `git merge` and `git push` instead (git's credential has the scope).

## Map
- `recipes/`: `recipe.yml` (lupios, kinoite-main:44) and `recipe-nvidia.yml` (kinoite-nvidia:44) share
  `common-modules.yml`: files → dnf → script → systemd → initramfs → signing.
- `files/system/`: copied to `/` verbatim. `files/scripts/`: run once at build time.
- `files/system/usr/bin/lupi`: the control tool (bash; sections: net, game, setup, level, usbguard, kargs,
  terminal toggles, lab, software, channel, state). Runs as root via `pkexec` from the widget and Welcome.
- `lab/Containerfile` + `build-lab.yml`: the Kali Lab image. `build-iso.yml`: installer ISOs (manual run):
  `lupios[-nvidia].iso` hold the whole OS, `lupios-online.iso` downloads it during setup.
- `boot-test.yml` (called by `build.yml` after every build for both flavours, or run by hand for any image) + `tests/boot/`:
  `bootc install to-disk --via-loopback` makes a disk from the image, QEMU/KVM boots it, and `checks.sh`
  runs inside as root and prints `LUPIOS-CI` lines to the serial console. The checks reach the VM as systemd
  credentials (`systemd.extra-unit.*` over SMBIOS, the script over fw_cfg), pulled in by the
  `systemd.wants=` kernel argument on the test disk only, so the image itself is never changed for testing.
  `mcelog.service` always fails in a VM (no hardware machine checks) and is ignored there.
  `checks.sh` holds every SECURITY.md promise, with the values written out (not read from the image), and
  flips the level, network trust and Game Mode the way the widget does (`PKEXEC_UID` set): change a
  setting and its check together. `lab-signature.sh` runs in a plain container of the image on the
  runner (no VM): the image's podman must accept the signed Lab, and refuse it under another key.
  `iso/anaconda/`: the installer's LupiOS look (stylesheet, Lorax template, generated SVGs), and the
  online installer (`lupios-online.tmpl` + `online/`).
- `art/generate.mjs`: all artwork (SVGs, fastfetch logo, installer art, website art, `art/preview.html`). The
  `check` workflow fails if its output isn't committed, so run `node art/generate.mjs` after editing it.
  The logo is the owner's design (2026-10-06), traced to outlines in `art/logo/lupios-{mark,wordmark}.svg`:
  one black path of straight segments each. The OS draws it in ink (paper) or bone (dark); the website still
  uses the night palette (`NIGHT` in generate.mjs) until it moves to the new look too.
  `lupios-logo-small.svg` thickens the lines for 16–32 px icons. The terminal logo is the mark in Braille
  dots (needs `dejavu-sans-mono-fonts`). The owner's file is a Figma export with JPEGs inside, not vectors.
- `website/`: the site (Astro Starlight), published by `website.yml` from `main` to https://lupios.org (GitHub Pages custom domain: DNS at Cloudflare, records DNS-only, HTTPS enforced; vukkz.github.io/lupios redirects there).
  `scripts/sync.mjs` copies `SECURITY.md`, `docs/install.md` and `docs/dual-boot.md` in before every build (the copies are
  git-ignored), so those files stay the only originals. Download buttons: `src/downloads.ts` (`ready`).
  Preview: `npm run dev` in `website/` → http://localhost:4321/. The link preview picture (`og:image`) is
  `src/assets/og.svg` from art/generate.mjs, rendered to `public/og.png` at build (`scripts/og-image.mjs`).
  The home page and the download page are their own Astro pages, `src/pages/index.astro` and `download.astro`
  (framed by `src/layouts/GuideLayout.astro`, styled by `src/styles/guide.css`; not Starlight): a "night field
  guide" (2026-10-16, refined 2026-10-19, designed with the Impeccable skill). PRODUCT.md (audience, promise, early
  release) and DESIGN.md (palette, type, named rules, motion) at the repo root are its references; the page brief is
  `.impeccable/surfaces/`. The type is Arimo everywhere, docs included (self-hosted with @fontsource): the logo's
  wordmark is Helvetica, bold "Lupi" + regular "OS", and Arimo has the same letter shapes. The Starlight sidebar
  links to /download/ (`link:`), since it isn't a docs page. `src/components/IdentificationKey.astro` is the ISO
  key, `Command.astro` a command with a Copy button. `download.astro` reads the Fedora version from
  `recipes/recipe.yml` at build time ("now Fedora 44"). The home page's Similar species table says what each
  neighbour claims about itself (sources in a comment in index.astro, checked 2026-10-19): recheck it now and then. Sections with `data-draw` rule their lines in when they
  scroll into view (GuideLayout's script); only lines and marks start hidden, never text. Screenshots in
  `src/assets/screenshots/` carry their origin in the PNG (`embed-prompt.mjs --read`).

## Conventions
- LF line endings everywhere (`.gitattributes`); the repo is edited on Windows. New executables:
  `git add --chmod=+x`, and list them in `files/scripts/fix-permissions.sh`.
- Shell: `set -euo pipefail`, must pass `shellcheck -S warning`. Comments explain *why*, briefly.
  Under pipefail, `producer | head -n` fails once the producer has more to write (SIGPIPE, exit 141): that
  failed both image builds on 2026-10-11 (layers.sh). Use `awk 'NR <= n'`, or `find ... -print -quit`.
- Outside GitHub Actions are pinned to a commit SHA with the exact version as a comment
  (`uses: owner/action@<sha> # v1.2.3`); Dependabot updates both. Never use a bare `@v7` tag: the builds
  hold SIGNING_SECRET and SF_SSH_KEY. Get a tag's commit with `gh api repos/<o>/<r>/git/ref/tags/<tag>`
  (follow `git/tags/<sha>` for annotated tags).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Ship defaults, not locks: user settings must always win (e.g. `/etc/xdg` defaults, `lupios-look`
  only touches settings still at their defaults). Every security setting is documented with its
  trade-off in SECURITY.md.

## Hard-won facts (verified; don't re-learn them)
- rpm-ostree ignores the BlueBuild `kargs` module (bootc-only), hence `lupi kargs on`, which runs
  `rpm-ostree kargs`. `lupios-kargs.timer` (enabled by the `systemd` module) runs it once by itself, 5 min
  after boot, until `/var/lib/lupios/kargs-decided` exists; `lupi kargs on/off` creates that file
  too, so the user's choice always wins. Security levels must **never** change kargs: that creates a new deployment and
  pushes the previous OS version out of the rollback slot.
- Fedora KDE: `XDG_CONFIG_DIRS=/etc/xdg:/usr/share/kde-settings/kde-profile/default/xdg`, so our defaults
  go in `/etc/xdg`. The app-menu icon is `start-here` (look.sh swaps it and deletes the sized PNGs).
  The default wallpaper is `/usr/share/wallpapers/Fedora` (symlinked to ours, LupiOS-Paper). A wallpaper package's
  `contents/images_dark/` is shown instead of `images/` while the colour scheme is dark (Plasma 5.26+), so Paper
  turns into Forest with "LupiOS Dark".
- Plasma 6.6 Welcome Center: `Welcome.Page { heading; description }` and
  `Welcome.Controller.runCommand(cmd, (code, output) => …)`. Pages live in
  `/usr/share/plasma/plasma-welcome/extra-pages/NN-Name.qml`. `debrand.sh` removes `plasma-welcome-fedora`
  with `rpm -e` *before* copying ours (dnf would also drop Flathub's remote package).
- Tray widget: `X-Plasma-NotificationAreaCategory` + `EnabledByDefault` auto-adds it. Commands run
  through the `plasma5support` executable engine. Root actions go through polkit action `org.lupios.lupi`
  (`auth_admin`: password every time). Started through pkexec (`PKEXEC_UID` set), `lupi` only accepts
  `level sheep|wolf [--yes]`, `net home|public`, `game on|off`: anything else could give a root shell
  (security review 2026-10-07). A new widget/Welcome button that needs root must be added to that list.
- BlueBuild tags: default branch → `latest`, `<Fedora>`, date. Other branches → `br-<branch>-<Fedora>`,
  always with the version (alt-tags too: blue-build/cli `github_driver.rs` `generate_tags`). So the testing
  channel's version-free `testing` tag is ours (skopeo copy in `channel-tag`; the signature is stored by
  digest, so it covers the new tag). The Fedora version lives only in the recipes' `image-version`: build.yml's
  `version` job and build-iso.yml read it from there (and fail if the two recipes differ).
- GitHub runs scheduled workflows only on the default branch. build.yml's `testing` job (schedule only)
  starts a testing build with `gh workflow run` (workflow_dispatch is the one event GITHUB_TOKEN may start),
  so testing builds daily too. GitHub starts the 06:00 schedule hours late (13:48 UTC on 2026-10-12, the first
  run). Pushing to testing while that build runs cancels it (harmless).
- ISO: `jasonn3/build-container-installer@v1.5.0`, installer product name = image name, Secure Boot key
  from `ublue-os/akmods` (enroll password `universalblue`). Artifacts expire after 14 days.
  The installer itself runs on Fedora's packages, so `fedora-logos` brands its sidebar as Fedora. Fix:
  `iso/anaconda/lupios-look.tmpl`, passed as `additional_templates` (absolute path: the builder mounts
  the repo at `/github/workspace`), overwrites `/usr/share/anaconda/pixmaps/{sidebar-logo,sidebar-bg,
  topbar-bg}.png` and every `*.css` there. So build-iso.yml must check out the repo and render the PNGs first.
  Additional templates run after the builder's own, with its template vars (`image_repo`, `image_tag`, ...).
  The builder's kickstart is `/usr/share/anaconda/interactive-defaults.ks` in the installer: `ostreecontainer
  --url=/run/install/repo/<image> --transport=oci`, then `%include`s of its post scripts (`bootc switch
  --mutate-in-place --enforce-container-sigpolicy` to the registry image; MOK enrollment from the ISO's
  `sb_pubkey.der`). The image sits on the ISO in `/<image name>` (an OCI layout of the registry's blobs, so the
  first update after an install only downloads what changed). Its `make_target` input exists, but files built
  inside its container are lost unless they're under `/github/workspace`.
- The online ISO (2026-10-10): `lupios-online.tmpl` replaces the `ostreecontainer` line with `%include
  /tmp/lupios-source.ks`, which `online/pick-image.sh` writes in `%pre` (Anaconda runs `%pre` from
  interactive-defaults.ks too: `startup_utils.find_kickstart` → `run_pre_scripts`). build-iso.yml then removes
  `/lupios` from the ISO with xorriso. Facts this rests on, all from the source:
  - Fedora's KDE profile (Kinoite's base) hides `NetworkSpoke PasswordSpoke UserSpoke`, so the full ISOs have no
    Wi-Fi screen. `/etc/anaconda/conf.d/` is read after the profile (`anaconda.py`), so a file there wins.
  - `ostree container image deploy` (what Anaconda runs) no longer verifies signatures unless given
    `--enforce-container-sigpolicy`, which Anaconda never passes (`--no-signature-verification` is a no-op).
    The image proxy still applies `/etc/containers/policy.json`, so the online installer carries LupiOS's
    policy (default reject), key and registries.d, and only a LupiOS-signed image installs.
  - Universal Blue's `-nvidia` images use `akmods-nvidia-open`: NVIDIA's open kernel module, Turing (GTX 16xx,
    RTX 20xx) and newer only, PCI device IDs from 0x1e00. Older NVIDIA cards belong on `lupios` (nouveau).
- systemd services (`lupios-kargs.service`) and NetworkManager's dispatcher (`lupi _classify`) run `lupi`
  without `$HOME`/`$USER`; with `set -u`, a bare `$HOME` at the top level killed both silently for 3 days.
  The check workflow now runs `env -i ... lupi help`. Inside functions only users reach, `$HOME` is fine.
- The installer (build-container-installer, Kinoite 44 profile) has no user or root spoke: KDE creates the
  first user, an administrator, on first boot.
- Don't use BlueBuild's `default-flatpaks` (v2): it runs on every boot, re-installs apps the user removed,
  and notifies at every login (`notify` defaults to true). Firefox and Flatseal come from
  `lupios-default-apps.timer` → `lupi _default-apps` instead: once, until `/var/lib/lupios/default-apps-done`.
- Flatpak apps keep running after `flatpak uninstall`; `lupi remove` closes them with `flatpak kill`.
- OpenSnitch (`lupi outgoing`) isn't in Fedora's repos: `files/scripts/opensnitch.sh` installs the GitHub
  release, pinned with SHA-256 (bump both to update; Dependabot can't). The daemon RPM's %post runs
  `systemctl start`, which fails in a container build, and dnf5 then fails the whole transaction even though
  it calls the error "non-critical": so the daemon RPM is installed with `tsflags=noscripts`. The pop-up
  app autostarts via our `/etc/xdg/autostart/opensnitch_ui.desktop` → `lupi-outgoing-ui`, which exits
  unless the daemon is enabled. Daemon default: allow when no UI is connected. Pre-approved rules:
  `000-lupios-system.json` (system daemons, any user) and `001-lupios-root-tools.json` (skopeo, podman, flatpak
  only as uid 0: they can upload anything, so as the user they must ask). A `list` operator ANDs its `list`
  entries (OpenSnitch 1.8 `daemon/rule/operator.go`; `data` is ignored for lists).
- QML and anything Plasma can't be tested on Windows: test in the VM. VirtualBox there runs in
  Hyper-V (NEM) mode: slow, and once hung at `boot.mount` after an update (a reboot fixed it).
  With 3D acceleration on (VMSVGA), the 2026-10-08 update (ublue base 44.20261008, kernel 7.2.9) gave a
  black screen with only a cursor, then a VM stuck in reset (VBox.log ends at `PDMR3Reset`). Fixed with
  `VBoxManage controlvm LupiOS poweroff` + `modifyvm LupiOS --accelerate-3d=off`. Screenshots:
  `VBoxManage controlvm LupiOS screenshotpng <file>`. The boot test (QEMU virtio-gpu) can't see this.
- nmap from the Kali VM on the host-only network needs `-n` (no DNS there).
- avahi-daemon ignores NetworkManager's per-connection `mdns`/`llmnr` and announces `<hostname>.local` on
  every network. Public networks stay quiet through the firewalld policy `lupios-public-quiet` (ingress
  `HOST`, egress `lupios-public`), which drops outgoing discovery ports. Verified in the VM on 2026-10-02:
  `echo hi > /dev/udp/224.0.0.251/5353` gets EPERM on public, 5354 and home go through. avahi only logs
  failed sends at debug level, so its journal shows nothing either way.
- Security levels: **sheep** is the everyday default, **wolf** is maximum caution (the owner swapped them on
  2026-10-03: a sheep grazes calmly, a wolf is alert and hunting). `lupi level` points symlinks in `/etc`
  (sysctl.d, resolved.conf.d, NetworkManager conf.d) at `/usr/share/lupios/levels/<name>/`, so renaming
  those folders silently changes what existing installs get: check what `/etc` still points at.
- Container signature rules (`/etc/containers/policy.json`) match whole path components: BlueBuild's
  rule for `ghcr.io/vukkz/lupios` does **not** cover `ghcr.io/vukkz/lupios-lab`, which fell to the
  "accept anything" default until 2026-10-07. `files/scripts/lab-signature.sh` (a `script@v1` module
  after `signing`) copies the OS rule for the Lab; `registries.d/lupios-lab.yaml` says where its signatures
  are. The Lab is signed by `cosign-installer@v3` (cosign 2: `sha256-<digest>.sig` tags, which podman reads).
  Since 2026-10-09 it's `cosign-installer@v4` (cosign 3), whose default is a new bundle format podman can't
  find, so `build-lab.yml` signs with `--new-bundle-format=false --use-signing-config=false`. Dependabot PRs
  never get repo secrets, so their image builds always fail at signing ("Unable to find private/public key pair").
  podman/skopeo check the signature of the **platform image** they pull, never the list around it (and
  `--multi-arch=index-only` copies skip the check entirely: containers/image `copy/single.go`). buildx
  pushes the Lab as a list (amd64 + provenance), so `build-lab.yml` signs with `cosign sign --recursive`.
- NetworkManager hands every connection's DNS servers to systemd-resolved even with `dns=none`, unless
  `systemd-resolved=false` (both re-read on `systemctl reload NetworkManager`). The wolf level sets both,
  and `level_dns` reloads NetworkManager, restarts resolved, then runs `resolvectl revert` on every link: resolved
  saves what NM handed it in `/run/systemd/resolve/netif/` and reloads that after a restart (systemd source).
- Removing a package in the dnf module also removes everything that depends on it, including through
  virtual provides that `rpm -q --whatrequires <name>` doesn't show. Removing Fedora's wallpapers
  (desktop-backgrounds-kde, f44-backgrounds-*) took kde-settings-plasma, plasma-workspace, plasma-desktop
  and plasma-login-manager with them (2026-10-09; the boot test caught "display manager inactive"). Check a
  removal with `rpm -e --test <pkg>` in the VM, and read "Removing dependent packages" in the build log.
  `files/scripts/desktop-intact.sh` (first in the script module) now fails such a build.
- A distrobox's first start sets it up inside and takes minutes in the VM. Interrupting it (Ctrl+C) leaves
  a box whose `enter` fails with `crun: ptsname: Inappropriate ioctl for device` until `podman stop <box>`.
  Never hide that first start behind `>/dev/null`: `box_first_start` in `lupi` shows it.
- Distrobox (1.8, `distrobox-create`) always mounts the real `$HOME` at its own path, even with `--home`
  (that only changes `$HOME` inside), plus `/` at `/run/host`, `/tmp`, `/run/user/<uid>` (session bus,
  Wayland), `--privileged` and `label=disable`. So the normal Lab is no boundary. `lupi lab strict`
  (2026-10-07) is plain rootless `podman create`: one `:Z` folder (`~/LupiLab/lupi-lab-strict` →
  `/root/shared`), SELinux `container_t`, `sleep infinity` under `--init`, then `podman exec` per use.
  The boot test checks it as a real user (`labtest`, lingering) and downloads the Lab for that (40 GB disk).
- distrobox counts **any** container whose ID, image, name, status, labels or mounts contain the word
  "distrobox" as one of its boxes (`distrobox-list`: `[ -z "${container##*distrobox*}" ]`). The Lab image's
  description said "for distrobox", so the strict lab (plain podman, same image) was listed too, and
  `distrobox upgrade --all` in `lupi update` hung forever at "Starting container..." on it (2026-10-15).
  Never put "distrobox" in the Lab's labels; `lupi update` upgrades boxes by name and the strict lab
  with `podman exec ... apt-get full-upgrade`. Strict labs made before the fix keep the old label until
  `lupi lab reset strict`.
- Kali gives some tools **file capabilities** (nmap: `cap_net_bind_service,cap_net_admin,cap_net_raw=eip`) so users
  can run them unprivileged. The strict lab's capability set (`800425fb`: podman's default plus NET_RAW, no
  NET_ADMIN) can't grant them all, and Linux then refuses to start the program at all: nmap failed with
  "exec: /usr/lib/nmap/nmap: Operation not permitted" (found by the owner in the VM, 2026-10-16). Root needs no
  file capabilities, so `strict_filecaps` in `lupi` strips them inside the strict lab once (marker
  `/etc/lupios-filecaps-dropped`) and again after `lupi update` upgrades it. The boot test runs
  `nmap -sS -p 1 127.0.0.1` there (start + raw sockets). The normal Lab (distrobox, `--privileged`) is unaffected.
  `setcap` reads `(-r|<caps>) <file>` **pairs** (libcap `progs/setcap.c`): `setcap -r a b` strips `a`, then fails
  parsing `b` as capability text. The first fix piped every file into one `setcap -r`, so only the first lost its
  caps and nmap still failed; the boot test caught it. Hence `xargs -n1`.

## Open items
- Branding sweep in the VM (2026-10-09, read with `VBoxManage controlvm LupiOS keyboardputstring` + screenshots):
  only the full, unfiltered `flathub` remote (system), no menu or autostart entry mentions Fedora.
  Biggest packages: qt6-qtwebengine 278M, plasma-workspace-wallpapers 256M (nothing needs it),
  glibc-all-langpacks 228M, cosign 135M (ublue base; nothing needs it), python3-botocore 118M (only via
  `sos` → boto3 weak dep), mariadb-server 79M (recommended by akonadi-server-mysql: keep).
- Fresh install from our ISO with Secure Boot verified in the VM (2026-09-30, again as LupiOS on 2026-10-03:
  installer look, first-boot user, MOK, automatic kargs, `lupi check`, `lupi lab`). Rebuild the ISOs from
  `main` after promoting anything that changes the installer or should reach new installs.
- Real hardware (NVIDIA RTX 3050, gaming, Secure Boot, Wi-Fi trust, dispatcher notification) is untested:
  waiting for the owner's second SSD for dual-boot.
- Renamed from Wolf OS to LupiOS on 2026-10-03 ("Wolf OS"/WolfOS was crowded: a commercial Wolf-OS, hobby
  WolfOS distros, Wolfi). LupiOS was checked clean: no OS of that name, `lupi` clashes with no package
  (Repology), SourceForge `lupios` and lupios.org/.dev/.io/.com free. The old `wolf-os` images on GHCR are
  frozen; no compatibility code for Wolf OS installs (only the owner's VM had one; it gets reinstalled).
- ISOs are on SourceForge since 2026-10-08 (https://sourceforge.net/projects/lupios/files): `build-iso.yml` with
  `channel: stable` uploads `lupios[-nvidia].iso` + `-CHECKSUM` over rsync (secret `SF_SSH_KEY`, variable
  `SF_USER`=vukkz, host key pinned), replacing the previous files, so download links never change. First
  upload: 4.9 GB and 5.8 GB; 2026-10-09: 4.59 and 5.50 GB (the installer itself is ~1.2 GB of that);
  2026-10-11: 4.48 and 5.39 GB (nouveau out of the boot image). Update
  the sizes in `website/src/downloads.ts` when they change a lot. `lupios-online.iso` (1.22 GB): installed in the
  VM 2026-10-10 (VM `LupiOS-online`): picked `lupios`, downloaded 3.5 GB in ~13 min, `ostree-image-signed`
  origin, `lupi check` 8/9 (kargs pending). In the installer's shell (Ctrl+Alt+F2, back with Ctrl+Alt+F6)
  skopeo refused a wrong key and a non-LupiOS image. Anaconda shows no progress while it downloads (the bar
  stands still: the install guide says so). The MOK screen still times out (nobody was at the VM).
  On SourceForge and the website since 2026-10-10. `flavour=all` builds all three ISOs.
- Before going public: the Fedora 45 rebase. Fedora 45 final is due 2026-10-20 (fallback 10-27). On 2026-10-07:
  no `ublue-os/kinoite-main:45` (nor `beta`) yet, and their 44 base was last rebuilt on 10-02; Fedora's own
  `quay.io/fedora-ostree-desktops/kinoite:45` exists; COPR `atim/starship` already builds for fedora-45.
  When ublue's 45 appears: `image-version: 45` on `testing`, and the boot test shows what broke. In the
  same change: layers.sh's `dnf-history` component (see Rechunking below).
  The website is live since 2026-10-03, the boot test runs since 2026-10-07.
- Rechunking (`build_chunked_oci` in build.yml), on stable since 2026-10-08: images ~24% smaller (3.65 GB,
  NVIDIA 4.57 GB). The second NVIDIA build crashed inside rpm-ostree (ostree-ext chunking.rs:423 assertion,
  when reusing the previous build's layout as baseline), so NVIDIA uses `rechunk_clear_plan`: fine in every
  build since. Clean day-to-day update (two builds on the same base, 2026-10-08): **132 MB** (NVIDIA 141 MB)
  = rpmdb 78 MB + layer 98 45 MB + metadata 10 MB + font caches 0.1 MB. Layer 98's culprit (found 2026-10-09
  by diffing the layer's tar from two builds, objects → hardlinked paths): dnf5's
  `/usr/lib/sysimage/libdnf5/transaction_history.sqlite` (+ -wal/-shm), now tagged into `rpmdb`. And any change
  to LupiOS's own files (files/system: no package) re-downloaded the 260 MB last layer with the initramfs
  (the OS-links commit: 510 MB for NVIDIA), so layers.sh tags them as component `lupios` too.
  2026-10-10, two stable builds on the same base with no LupiOS file change: **87 MB** (NVIDIA 88) = rpmdb
  77 + metadata 9 + font caches 0.1; the last layer stayed the same. rpm takes install times (and the
  transaction ID) from `SOURCE_DATE_EPOCH` when it's set (`lib/rpmts.cc`), so common-modules.yml sets it
  as an `ARG` (visible to RUN steps, not stored in the image; buildah only dates the image itself from its
  `--source-date-epoch` flag or that variable in its own environment). layers.sh prints a fingerprint of
  each database dir. Verified 2026-10-10 (two testing builds of 4f5085d on one base): `/usr/share/rpm` and
  `rpm-ostree-base-db` come out identical; only `/usr/lib/sysimage/libdnf5` (dnf5's history, its own clock)
  differs, and it shares the rpmdb layer, so updates stay 87 MB. The image's own date stays the real build
  time. One-time cost of the change: 347 MB (NVIDIA 439): dracut uses the date too, so the last layer changed
  once. On stable since 2026-10-11. Next, **with the Fedora 45 rebase** (which re-downloads everything anyway,
  so the layout reshuffle is free then): give libdnf5 its own component (`dnf-history`) → ~10 MB updates.
  A new ublue base (Fedora updates, kernel) adds those packages and the 260 MB last layer.
  What fills the boot image (layers.sh prints it; 2026-10-11): lupios 229 MB = nouveau's NVIDIA GSP firmware
  106 MB (ga102/tu102 × r535/r570), amdgpu firmware 27, Intel microcode 17, the rest ~80; lupios-nvidia
  316 MB adds NVIDIA's own firmware (615.x, 117 MB) for early nvidia.ko. nouveau is off in lupios-nvidia and
  only useful in lupios for Turing+ cards (which belong on lupios-nvidia), so
  `dracut.conf.d/90-lupios-no-nouveau.conf` omits nouveau and nova_core/nova_drm (same firmware); the boot
  test checks with lsinitrd. Each kept deployment also stores its initramfs in /boot (1-2 GB).
  A file-by-file comparison of two no-change builds (2026-10-07) showed the initramfs is identical
  (BlueBuild runs `dracut --reproducible`). What changes every build is the rpm database (it records install
  times; stored twice) and the fontconfig caches, and rpm-ostree packs those into one ~375 MB "unpackaged
  content" layer with the initramfs and other non-RPM files, so that whole layer is re-downloaded.
  NVIDIA with `rechunk_clear_plan` built fine 3 times in a row (2026-10-07). Measured update between two
  testing builds: ~400 MB = layer 127 "unpackaged" 299 MB + layer 97 (a package group, cause unknown) 44 MB
  + layer 11 (`/usr/share/rpm`) 40 MB + layer 0 (metadata) 10 MB. `files/scripts/layers.sh` tags the rpmdb
  (`/usr/share/rpm` 107M and `/usr/lib/sysimage/rpm-ostree-base-db` 96M: different content, the base image's
  db) and the font caches with `user.component` xattrs; build-chunked-oci gives each its own layer (Red Hat,
  "Reduce bootc system update size", 2025-11). Verified 2026-10-07 (627e903): layer 1 `fontconfig-cache`,
  layer 2 `rpmdb` 78 MB. The initramfs (229M) ignores the xattr: rpm-ostree always puts it in the last layer,
  "initramfs (kernel …) and rpmostree-unpackaged-content" (260 MB). Changing the components reshuffles the
  whole layout once (that build: 50 new layers, 1.3 GB). The image config's `history[].created_by` names
  each layer's components.
  Measure by comparing the layer digests of two consecutive builds' manifests (GHCR registry API, anonymous
  token; each build's image digest is in its log): the layers the new one adds are the download.
- BlueBuild (recipe V1) copies its own CLI, cosign and nushell (~190 MB unpacked) into the image unless the
  recipe says `blue-build-tag: none`, `cosign-version: none`; nushell is still needed during the build (dnf
  and script@v2 modules run on it), so the last module deletes it with `script@v1` (plain shell).
- The look moved from night (navy, ice blue) to **paper and ink** (2026-10-19, the owner's choice from two
  concept boards; no brand colour at all): a naturalist's sketchbook, pencil branches and spruces drawn in code
  (`branch`, `spruce`, `forest` in art/generate.mjs, seeded), the light "LupiOS" scheme as the default and
  "LupiOS Dark" (the forest at dusk) beside it. The boot screen and the terminal stay dark: Fedora's
  Plymouth password box and spinner are white assets made for dark, and hacking tools' colours assume a dark
  terminal. Red, amber and green stay in the colour schemes for errors, warnings and success. `lupios-look`
  v2 moves accounts still on the night defaults (it re-applies "LupiOS", whose colours Plasma copies into
  kdeglobals). Still to confirm in the VM: that Plasma inks the start-here icon (`current-color-scheme`
  stylesheet, `ColorScheme-Text`) bone on a dark panel, and that `org.fedoraproject.fedora.desktop` (the light
  global theme) exists in Fedora 44. Phase 2: the website (guide.css, lupios.css, DESIGN.md, og image).
- Ideas: a LupiOS control center in Rust (owner is learning Rust in C:\dev\kernel).
- The terminal stays plain Konsole (the owner dropped the "Howl" rename on 2026-09-30: users pick and
  customise their own terminal). LupiOS only adds defaults to it: fastfetch and the prompt.
- `lupi outgoing` (OpenSnitch) was verified working in the VM on 2026-09-30. The installer's boot menu
  and boot splash weren't checked yet (only its sidebar).
