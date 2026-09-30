# Wolf OS: notes for Claude

A security-first daily-driver Linux distro: Fedora Atomic 44 (KDE, via Universal Blue) built with
BlueBuild. Solo project by vukkz, who is learning as we go: explain things in plain language,
and make sure they understand the *why* (see README.md, SECURITY.md, docs/install.md).

## Workflow rules
- **Ask before every commit or push.** The owner says "push" when ready.
- **New work goes to the `testing` branch first** (image tag `br-testing-44`). Promote to stable only
  when the owner approves: `git push origin testing:main` (tag `latest`, what users get).
- After pushing, watch the builds with `gh run list/watch -R vukkz/wolf-os` and read the build log
  for evidence that the change landed, not just a green tick. Image builds take about 15 min.
- **Don't push to a branch while a build on that branch is running:** `build.yml` cancels in-progress
  builds on the same ref (`cancel-in-progress`), which also breaks anything waiting for that build.
- A new branch created identical to another skips `paths-ignore` workflows. Start it with
  `gh workflow run build.yml --ref <branch>`.
- The `gh` token lacks the `workflow` scope: merging a PR that touches `.github/workflows/*` fails once the
  base has moved. Merge locally with `git merge` and `git push` instead (git's credential has the scope).

## Map
- `recipes/`: `recipe.yml` (wolf-os, kinoite-main:44) and `recipe-nvidia.yml` (kinoite-nvidia:44) share
  `common-modules.yml`: files → dnf → script → systemd → initramfs → signing.
- `files/system/`: copied to `/` verbatim. `files/scripts/`: run once at build time.
- `files/system/usr/bin/wolf`: the control tool (bash; sections: net, game, setup, level, usbguard, kargs,
  terminal toggles, lab, software, channel, state). Runs as root via `pkexec` from the widget and Welcome.
- `lab/Containerfile` + `build-lab.yml`: the Kali Lab image. `build-iso.yml`: installer ISOs (manual run).
  `iso/anaconda/`: the installer's Wolf OS look (stylesheet, Lorax template, generated SVGs).
- `art/generate.mjs`: all artwork (SVGs, fastfetch logo, installer art, `art/preview.html`). The `check`
  workflow fails if its output isn't committed, so run `node art/generate.mjs` after editing it.

## Conventions
- LF line endings everywhere (`.gitattributes`); the repo is edited on Windows. New executables:
  `git add --chmod=+x`, and list them in `files/scripts/fix-permissions.sh`.
- Shell: `set -euo pipefail`, must pass `shellcheck -S warning`. Comments explain *why*, briefly.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Ship defaults, not locks: user settings must always win (e.g. `/etc/xdg` defaults, `wolf-os-look`
  only touches settings still at their defaults). Every security setting is documented with its
  trade-off in SECURITY.md.

## Hard-won facts (verified; don't re-learn them)
- rpm-ostree ignores the BlueBuild `kargs` module (bootc-only), hence `wolf kargs on`, which runs
  `rpm-ostree kargs`. `wolf-kargs.timer` (enabled by the `systemd` module) runs it once by itself, 5 min
  after boot, until `/var/lib/wolf-os/kargs-decided` exists; `wolf kargs on/off` creates that file
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
  through the `plasma5support` executable engine. Root actions go through polkit action `org.wolfos.wolf`.
- BlueBuild tags: default branch → `latest`, `44`, date. Other branches → `br-<branch>-44`.
- ISO: `jasonn3/build-container-installer@v1.5.0`, installer product name = image name, Secure Boot key
  from `ublue-os/akmods` (enroll password `universalblue`). Artifacts expire after 14 days.
  The installer itself runs on Fedora's packages, so `fedora-logos` brands its sidebar as Fedora. Fix:
  `iso/anaconda/wolf-os-look.tmpl`, passed as `additional_templates` (absolute path: the builder mounts
  the repo at `/github/workspace`), overwrites `/usr/share/anaconda/pixmaps/{sidebar-logo,sidebar-bg,
  topbar-bg}.png` and every `*.css` there. So build-iso.yml must check out the repo and render the PNGs first.
- systemd services (`wolf-kargs.service`) and NetworkManager's dispatcher (`wolf _classify`) run `wolf`
  without `$HOME`/`$USER`; with `set -u`, a bare `$HOME` at the top level killed both silently for 3 days.
  The check workflow now runs `env -i ... wolf help`. Inside functions only users reach, `$HOME` is fine.
- The installer (build-container-installer, Kinoite 44 profile) has no user or root spoke: KDE creates the
  first user, an administrator, on first boot.
- Don't use BlueBuild's `default-flatpaks` (v2): it runs on every boot, re-installs apps the user removed,
  and notifies at every login (`notify` defaults to true). Firefox and Flatseal come from
  `wolf-default-apps.timer` → `wolf _default-apps` instead: once, until `/var/lib/wolf-os/default-apps-done`.
- Flatpak apps keep running after `flatpak uninstall`; `wolf remove` closes them with `flatpak kill`.
- OpenSnitch (`wolf outgoing`) isn't in Fedora's repos: `files/scripts/opensnitch.sh` installs the GitHub
  release, pinned with SHA-256 (bump both to update; Dependabot can't). The daemon RPM's %post runs
  `systemctl start`, which fails in a container build, and dnf5 then fails the whole transaction even though
  it calls the error "non-critical": so the daemon RPM is installed with `tsflags=noscripts`. The pop-up
  app autostarts via our `/etc/xdg/autostart/opensnitch_ui.desktop` → `wolf-outgoing-ui`, which exits
  unless the daemon is enabled. Daemon default: allow when no UI is connected.
- QML and anything Plasma can't be tested on Windows: test in the VM. VirtualBox there runs in
  Hyper-V (NEM) mode: slow, and once hung at `boot.mount` after an update (a reboot fixed it).
- nmap from the Kali VM on the host-only network needs `-n` (no DNS there).
- A distrobox's first start sets it up inside and takes minutes in the VM. Interrupting it (Ctrl+C) leaves
  a box whose `enter` fails with `crun: ptsname: Inappropriate ioctl for device` until `podman stop <box>`.
  Never hide that first start behind `>/dev/null`: `box_first_start` in `wolf` shows it.

## Open items
- Owner hasn't reported `flatpak remotes` output or remaining "Fedora" branding yet.
- Fresh install from our ISO with Secure Boot verified in the VM on 2026-09-30 (installer look, first-boot
  user, MOK, `wolf channel testing`, automatic kargs, `wolf check`). Rebuild the ISOs from `main` after
  promoting, so they carry the Wolf installer look and the new image.
- Real hardware (NVIDIA RTX 3050, gaming, Secure Boot, Wi-Fi trust, dispatcher notification) is untested:
  waiting for the owner's second SSD for dual-boot.
- Before going public: check the name ("Wolfi" and others exist), ISO hosting, a website, Fedora 45 rebase
  (around Oct–Nov 2026), and a boot test in CI.
- Ideas: Wolf Center in Rust (owner is learning Rust in C:\dev\kernel), strict lab mode, podman signature
  policy for the lab image, Howl colour scheme.
- Untested in the VM: `wolf outgoing` (OpenSnitch eBPF under our sysctls, the pre-approved rule, the
  autostart unit name `app-opensnitch_ui@autostart.service`). The installer's sidebar shows the Wolf OS
  look (verified in the VM on 2026-09-30); its boot menu and boot splash weren't checked yet.
