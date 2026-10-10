# LupiOS: notes for Claude

A security-first daily-driver Linux distro: Fedora Atomic 44 (KDE, via Universal Blue) built with
BlueBuild. Solo project by vukkz, who is learning as we go: explain things in plain language,
and make sure they understand the *why* (see README.md, SECURITY.md, docs/install.md).

## Workflow rules
- **Ask before every commit or push.** The owner says "push" when ready.
- **New work goes to the `testing` branch first** (image tag `br-testing-44`). Promote to stable only
  when the owner approves: `git push origin testing:main` (tag `latest`, what users get).
- After pushing, watch the builds with `gh run list/watch -R vukkz/lupios` and read the build log
  for evidence that the change landed, not just a green tick. Image builds take about 15 min (longer with
  rechunking), then the **Boot test** job (~15 min). Only promote a `testing` build whose boot test passed.
- **Don't push to a branch while a build on that branch is running:** `build.yml` cancels in-progress
  builds on the same ref (`cancel-in-progress`), which also breaks anything waiting for that build.
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
  one black path of straight segments each, drawn in ice blue (dark backgrounds) or deep blue (light).
  `lupios-logo-small.svg` thickens the lines for 16–32 px icons. The terminal logo is the mark in Braille
  dots (needs `dejavu-sans-mono-fonts`). The owner's file is a Figma export with JPEGs inside, not vectors.
- `website/`: the site (Astro Starlight), published by `website.yml` from `main` to https://lupios.org (GitHub Pages custom domain: DNS at Cloudflare, records DNS-only, HTTPS enforced; vukkz.github.io/lupios redirects there).
  `scripts/sync.mjs` copies `SECURITY.md`, `docs/install.md` and `docs/dual-boot.md` in before every build (the copies are
  git-ignored), so those files stay the only originals. Download buttons: `src/downloads.ts` (`ready`).
  Preview: `npm run dev` in `website/` → http://localhost:4321/.

## Conventions
- LF line endings everywhere (`.gitattributes`); the repo is edited on Windows. New executables:
  `git add --chmod=+x`, and list them in `files/scripts/fix-permissions.sh`.
- Shell: `set -euo pipefail`, must pass `shellcheck -S warning`. Comments explain *why*, briefly.
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
  The default wallpaper is `/usr/share/wallpapers/Fedora` (symlinked to ours).
- Plasma 6.6 Welcome Center: `Welcome.Page { heading; description }` and
  `Welcome.Controller.runCommand(cmd, (code, output) => …)`. Pages live in
  `/usr/share/plasma/plasma-welcome/extra-pages/NN-Name.qml`. `debrand.sh` removes `plasma-welcome-fedora`
  with `rpm -e` *before* copying ours (dnf would also drop Flathub's remote package).
- Tray widget: `X-Plasma-NotificationAreaCategory` + `EnabledByDefault` auto-adds it. Commands run
  through the `plasma5support` executable engine. Root actions go through polkit action `org.lupios.lupi`
  (`auth_admin`: password every time). Started through pkexec (`PKEXEC_UID` set), `lupi` only accepts
  `level sheep|wolf [--yes]`, `net home|public`, `game on|off`: anything else could give a root shell
  (security review 2026-10-07). A new widget/Welcome button that needs root must be added to that list.
- BlueBuild tags: default branch → `latest`, `44`, date. Other branches → `br-<branch>-44`.
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
  upload: 4.9 GB and 5.8 GB; 2026-10-09: 4.59 and 5.50 GB (the installer itself is ~1.2 GB of that). Update
  the sizes in `website/src/downloads.ts` when they change a lot. `lupios-online.iso` (~1.2 GB): built on
  testing 2026-10-10, not yet tested in the VM, on SourceForge or on the website.
- Before going public: the Fedora 45 rebase. Fedora 45 final is due 2026-10-20 (fallback 10-27). On 2026-10-07:
  no `ublue-os/kinoite-main:45` (nor `beta`) yet, and their 44 base was last rebuilt on 10-02; Fedora's own
  `quay.io/fedora-ostree-desktops/kinoite:45` exists; COPR `atim/starship` already builds for fedora-45.
  When ublue's 45 appears: `image-version: 45` on `testing`, and the boot test shows what broke.
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
  A new ublue base (Fedora updates, kernel) adds those packages and the 260 MB last layer.
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
- Ideas: a LupiOS control center in Rust (owner is learning Rust in C:\dev\kernel).
- The terminal stays plain Konsole (the owner dropped the "Howl" rename on 2026-09-30: users pick and
  customise their own terminal). LupiOS only adds defaults to it: fastfetch and the prompt.
- `lupi outgoing` (OpenSnitch) was verified working in the VM on 2026-09-30. The installer's boot menu
  and boot splash weren't checked yet (only its sidebar).
