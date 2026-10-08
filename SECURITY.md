# LupiOS security

LupiOS aims for **hardening that doesn't get in your way**. Every setting here is on
by default unless marked *opt-in*. Each one lists what it protects against, what it
can break, and how to undo it. Run `lupi check` to see the live status.

Every new build is booted in a virtual machine that checks these promises from inside
(`tests/boot/checks.sh`), and changes only reach the stable channel after passing it.

Base: Fedora Atomic 44 (KDE Plasma) via Universal Blue. That already gives you
SELinux enforcing, a read-only `/usr`, atomic updates with rollback, and sandboxed
Flatpak apps. Everything below is added on top.

## Updates

| Setting | Why | Trade-off |
|---|---|---|
| Images signed with cosign (`cosign.pub`) | Your system only accepts updates signed with the LupiOS key, so a hijacked registry can't push you a malicious OS | You must rebase with `ostree-image-signed:` once (see the [README](README.md#installation)) |
| Automatic updates (Universal Blue default) | Security fixes arrive without you remembering | Updates apply on the next reboot |
| Fedora version pinned (`image-version: 44`) | Big upgrades are a deliberate change, not a surprise | Moving to Fedora 45 is a manual edit of `recipe.yml` |
| Build tools pinned to exact commits (`.github/workflows/`) | Every outside GitHub Action runs at a fixed commit, not a version label its owner could move, so a hijacked action can't run in the builds that hold the signing key | Their updates come as Dependabot pull requests, which have to be merged |

### Where the software comes from

You trust every source below, so here they all are:

| What | From | Checked by |
|---|---|---|
| The operating system | Fedora's packages, in Universal Blue's base image | Fedora's package signatures; Universal Blue's image signature |
| NVIDIA driver and extra kernel drivers | Universal Blue (`ublue-os/akmods`) | Their signature, and Secure Boot (their key, enrolled once) |
| The terminal prompt (starship) | A COPR repository (`atim/starship`): built by Fedora's servers, but packaged by one person and not reviewed by Fedora | COPR's signature, which only proves it came from that repository |
| OpenSnitch (`lupi outgoing`) | Its official GitHub release | A SHA-256 checksum written into LupiOS: a changed file fails the build |
| Apps (Firefox, Flatseal, `lupi install`) | Flathub | Flathub's signature; they run in Flatpak's sandbox |
| The Lupi Lab | Kali Linux's image and repositories, rebuilt weekly by LupiOS | LupiOS's signature on the image (podman checks it), Kali's package signatures |
| Command-line tools (`lupi install`) | Arch Linux's repositories | Arch's package signatures |

## Firewall: `files/system/usr/lib/firewalld/zones/lupios.xml`

The default zone is `lupios`: **all incoming connections are blocked** except DHCPv6
and mDNS (finding printers and devices on your LAN). Outgoing traffic isn't restricted.
Stock Fedora desktops allow incoming ports 1025–65535.

**Can break:** anything that needs other devices to connect *to* you. Open what you need:

| Feature | Command |
|---|---|
| KDE Connect | `sudo firewall-cmd --permanent --add-service=kdeconnect` |
| Steam Remote Play / LAN games | `sudo firewall-cmd --permanent --add-service=steam-streaming` |
| SSH into this machine | `sudo firewall-cmd --permanent --add-service=ssh` |
| Anything else | `sudo firewall-cmd --permanent --add-port=PORT/tcp` |

Then `sudo firewall-cmd --reload`. Undo everything: `sudo firewall-cmd --set-default-zone=FedoraWorkstation`.

## Kernel settings: `files/system/usr/lib/sysctl.d/90-lupios-hardening.conf`

| Setting | Why | Can break |
|---|---|---|
| `kernel.kptr_restrict=2`, `kernel.dmesg_restrict=1` | Hides kernel memory addresses and logs that exploits use to aim | `dmesg` needs `sudo` |
| `kernel.unprivileged_bpf_disabled=1`, `net.core.bpf_jit_harden=2` | BPF is a common kernel exploit path | Nothing for normal users |
| `kernel.kexec_load_disabled=1` | Stops an attacker with root from loading a different kernel | kdump crash dumps |
| `dev.tty.ldisc_autoload=0` | Blocks a class of TTY kernel exploits | Nothing common |
| `kernel.yama.ptrace_scope=1` | Programs can't read the memory of other programs you run (e.g. malware reading your browser) | Attaching a debugger to a running program needs `sudo` |
| `vm.mmap_rnd_bits=32`, `vm.mmap_rnd_compat_bits=16` | More ASLR randomness, so exploits have to guess harder | Nothing known |
| `fs.protected_*`, `fs.suid_dumpable=0` | Blocks file-trick attacks in shared folders like `/tmp`, and core dumps leaking secrets | Nothing common |
| No ICMP redirects, no source routing, `tcp_rfc1337` | Other machines on your network can't reroute your traffic | Nothing for a desktop |

To change one: put the same key in `/etc/sysctl.d/99-local.conf`, then run `sudo sysctl --system`.

**Deliberately left alone:**
- `rp_filter` stays at systemd's "loose" mode, because strict mode breaks many VPNs.
- `io_uring` stays enabled, because some apps and games need it.

## Kernel boot arguments: added automatically, once

`slab_nomerge init_on_alloc=1 page_alloc.shuffle=1 randomize_kstack_offset=on vsyscall=none`
(the list is in `files/system/usr/share/lupios/kargs`)

These make kernel memory-corruption bugs much harder to exploit. The cost is a small
amount of performance and memory.
- `vsyscall=none` breaks only ancient (pre-2012) Linux programs. Windows games through Proton aren't affected.
- `init_on_free=1` was left out on purpose because of its bigger performance cost.

Updates through `rpm-ostree` don't apply kernel arguments from the image, so LupiOS adds them
itself: `lupios-kargs.timer` runs `lupi _kargs-auto` 5 minutes after startup, shows a notification,
and the arguments are active from the next restart on. It runs only until it has worked once.
- Adding them creates a new boot entry. The first time, the previous entry becomes the same version
  without the extra arguments, so the rollback slot holds no older version until the next update.
- **Undo with `lupi kargs off`.** That choice is remembered (`/var/lib/lupios/kargs-decided`), and
  LupiOS never adds them back by itself. `lupi kargs on` turns them on again.

## Blocked kernel modules: `files/system/usr/lib/modprobe.d/lupios-blacklist.conf`

These modules can't be auto-loaded:
- Rare network protocols (DCCP, SCTP, RDS, TIPC, and others) that have had many kernel bugs.
- FireWire, which allows direct memory access attacks.
- The `vivid` test driver.
- Some obscure filesystems.

**Can break:** FireWire audio interfaces and camcorders, which are very rare now.
HFS+ (Mac drives), UDF (discs) and exFAT still work.

## Network privacy: `files/system/usr/lib/NetworkManager/conf.d/90-lupios-privacy.conf`

- Each Wi-Fi network sees a different MAC address that stays the same for that network. Networks can't track you across locations, but captive portals and router reservations still work.
- Temporary IPv6 addresses are preferred for outgoing connections.
- Networks can't rename your PC. A fresh install has no name of its own yet, and NetworkManager would
  otherwise take one from the network: whatever the router or its DNS hands out. Your PC stays
  `lupios` until you choose a name with `hostnamectl hostname NAME`.

## USBGuard (*opt-in*): `lupi usbguard on`

When it's on, only the USB devices plugged in when you turned it on are allowed.
A malicious USB stick pretending to be a keyboard gets blocked. It's off by default
because it's easy to lock yourself out of a new keyboard.

## Outgoing guard (*opt-in, on in wolf*): `lupi outgoing on`

The firewall above stops strangers connecting **to** you. The outgoing guard covers the
other direction: [OpenSnitch](https://github.com/evilsocket/opensnitch) asks the first time
each app connects somewhere ("Discord wants to connect to discord.com: allow or deny?") and
remembers your answer. It catches things you didn't expect to go online: telemetry, a script
or game mod phoning home, a malicious package calling out.

- **Installed from OpenSnitch's official release**, pinned to a version and checked against
  its published SHA-256 checksums at build time (`files/scripts/opensnitch.sh`). It isn't in
  Fedora's repos.
- **LupiOS's own services are pre-approved** (DNS, network setup, time, system and firmware
  updates) in `/etc/opensnitchd/rules/000-lupios-system.json`, so the first minutes aren't a
  wall of questions. A deny rule of your own still wins.
- **skopeo, podman and flatpak are only pre-approved when root runs them** (system and app
  updates, `lupi lab root`: `001-lupios-root-tools.json`). They download or upload whatever
  they're told to, so malware running as you could otherwise use them to send your files out
  without a question. **Trade-off:** the first `lupi lab`, `lupi install` or app install you
  start yourself asks once.
- **Off by default**, because the questions take getting used to, and a friend who clicks
  Allow on everything gains nothing. The wolf level turns it on, and off again when you leave
  wolf, unless you had turned it on yourself.

**What it can't do:**
- **When the pop-up app isn't running, connections are allowed** (OpenSnitch's default), so a
  crashed or closed pop-up never cuts off the internet. Malware running as you could close it
  on purpose.
- **Malware inside an app you already allowed** (your browser, say) can use that app's permission.
- **Traffic that can't be tied to an app** passes, for example raw packets from `nmap` scans
  in `lupi lab root`.

## Network trust: `lupi net`

Every Wi-Fi or wired network has a trust level. The first time you connect to one,
LupiOS picks a safe default and sends a notification:
- **New Wi-Fi networks are public** (you might be in a café).
- **New wired networks are home.**

Change it any time with `lupi net home` or `lupi net public`. The file behind this
is `files/system/usr/lib/NetworkManager/dispatcher.d/90-lupios-network-trust`.

| | Home (zone `lupios`) | Public (zone `lupios-public`) |
|---|---|---|
| Incoming connections | Blocked, except device discovery (mDNS) | **All silently dropped**, including pings. Scanners see nothing |
| Announce this PC's name and services (mDNS/avahi, LLMNR, NetBIOS, SSDP) | Yes | **No: the firewall drops them on the way out**, whichever app sends them |
| Send your hostname to the router (DHCP) | Yes | No |
| Wi-Fi MAC address | Stable for this network | **New random one every time you connect** |

Staying quiet takes two parts. NetworkManager's `mdns`/`llmnr` settings only cover
systemd-resolved, but `avahi-daemon` announces `<hostname>.local` on its own, and browsers
and music apps do their own discovery too. So on public networks a firewall *policy*
(`files/system/usr/lib/firewalld/policies/lupios-public-quiet.xml`) drops everything this PC
sends on the discovery ports: mDNS 5353, LLMNR 5355, NetBIOS 137–138 and SSDP 1900. Zones only
filter incoming traffic; policies can filter what leaves. To see it work, on a public network
run `echo hi > /dev/udp/224.0.0.251/5353`: it fails with "Operation not permitted", while the
same on port 5354, or on a home network, goes through.

**Can break on public networks:** casting to a TV, network printers and KDE Connect,
because they rely on devices finding each other. That's the point on a network you
don't control. Use `lupi net home` on networks you trust.

## Game Mode: `lupi game on`

A temporary mode for playing. **Everything it changes resets at reboot or with `lupi game off`.**
- Opens Steam Remote Play and Steam LAN game transfer (firewalld services `steam-streaming`,
  `steam-lan-transfer`), but **only on home networks**. On public networks they stay closed.
- Turns off the split-lock slowdown (`kernel.split_lock_mitigate`), as SteamOS always does: it
  fixes stutter in a few games. That setting only exists on CPUs that detect split locks (mostly
  Intel); elsewhere this step does nothing.
- Pauses automatic updates, so they don't take bandwidth or CPU mid-game.
- Switches to the *performance* power profile.

It works on any security level. There's deliberately no "gaming" security level: a permanent
switch and a temporary one, both about gaming, would be confusing, and pausing updates must never
be permanent, so it can't be a level.

## Security levels: `lupi level`

One switch that moves a bundle of settings together. It stays until you change it.
The files are in `files/system/usr/share/lupios/levels/`.

| | sheep (default) | wolf (maximum caution) |
|---|---|---|
| Everything above in this file | ✔ | ✔ |
| Steam Remote Play/LAN ports on home networks | Only in Game Mode | Only in Game Mode |
| Split-lock slowdown (`kernel.split_lock_mitigate`) | On (off during Game Mode) | On (off during Game Mode) |
| Encrypted DNS: every lookup goes to Quad9 over TLS, ignoring the network's DNS | | ✔ |
| Reply to pings | Yes | No |
| io_uring, a kernel I/O interface with many past exploits | On | Off |
| Magic SysRq keyboard shortcuts | Sync only | Off |
| TCP timestamps, which reveal uptime | On | Off |
| USBGuard | Your choice | On |
| Outgoing guard: apps ask before they connect (OpenSnitch) | Your choice | On |

Switching levels is instant and needs no reboot. **Levels never change kernel boot
arguments.** On LupiOS that creates a new boot entry, which takes a minute, needs a
reboot, and pushes your previous OS version out of the rollback slot.

**Extra hardening you can add by hand:** wipe freed memory, so leftover passwords and
keys can't be read by an exploit. It costs a few percent of speed. Add it with
`sudo rpm-ostree kargs --append-if-missing=init_on_free=1` and reboot. Remove it with
`--delete-if-present=init_on_free=1`.

**Wolf breaks some things:**
- Wi-Fi login pages (hotels, airports, trains) don't load, because DNS only goes to
  Quad9. Switch to `lupi level sheep`, log in, then switch back.
- Names that only a VPN's or company network's own DNS knows (intranet sites) don't resolve,
  because only Quad9 is asked.
- A few apps that use io_uring can fail.
- Every app asks once before it goes online, so expect questions in the first minutes and
  after installing something new.

## The LupiOS panel widget and LupiOS Welcome

Both run `/usr/bin/lupi` as root through `pkexec`, so every change asks for your password.
The polkit rule in `files/system/usr/share/polkit-1/actions/org.lupios.lupi.policy`:
- **Only covers `/usr/bin/lupi`,** which lives in the read-only system image and can't be swapped out.
- **Only the switches the widget and Welcome offer** work this way: the security level, network trust and
  Game Mode. `lupi` refuses everything else when started through `pkexec`, because commands like
  `lupi lab` could otherwise hand a root shell to any program allowed to use `pkexec` (found in a review
  on 2026-10-07). Those run in a terminal, where `sudo` asks for your password itself.
- **Asks for your password every time** (`auth_admin`). polkit could remember it for a few minutes
  (`auth_admin_keep`), but then any program in your session could flip these switches without asking
  in that time. **Trade-off:** changing three settings in a row means typing the password three times.

Reading the current state (`lupi state`) needs no password and changes nothing.

## Installing software: `lupi install`

- **Apps come from Flathub** and run in Flatpak's sandbox. See or tighten each app's permissions in **Flatseal**.
- **Command-line tools go into the `lupi-tools` box** (Arch Linux, packages signed by Arch).
  Their commands are linked into `~/.local/bin`. Like the Lab, the box keeps them off the
  system image, but it **is not a sandbox**: a tool in it can reach your files.
- **A tool never replaces a system command.** `~/.local/bin` comes before `/usr/bin`, so a link
  named `sudo` or `ls` would take over in every terminal. Commands LupiOS already has are not
  linked (run Arch's version inside the box instead).
- Nothing is ever installed into the system image itself. Use `rpm-ostree install` only
  if something truly has to be part of the system, such as a driver.

## Lupi Lab: `lupi lab`

The Kali tools live in a container (`lab/Containerfile`), not on the host. Here's
exactly what that does and doesn't protect.

**What it gives you:**
- No attack tools, and none of their thousands of dependencies, installed on the host system.
- Tools run as your user, not root. Only `lupi lab root` gets raw network access.
- Tools start in their own home folder (`~/LupiLab`), so their configs, histories and loot don't
  clutter yours. (Your real home folder is still reachable from the lab: see below.)
- The lab image is rebuilt weekly and signed with the same key as the OS, and podman checks
  that signature: a Lab image not signed by LupiOS is refused, so a hijacked registry can't hand
  you a Lab with a backdoor (`/etc/containers/policy.json`, set by `files/scripts/lab-signature.sh`).
  Tools you install *inside* the lab come from Kali's own signed repositories.

**What it doesn't do:** it is **not a sandbox**. Distrobox shares your user account with the
lab on purpose, so that GUI tools and moving files around just work:
- **Your real home folder is mounted in the lab** at its usual path, and the whole disk under
  `/run/host`. A tool in the lab can read and change your files, `~/.ssh` included.
- **It shares your desktop session:** display, sound and the session bus. Through the session
  bus, a program in the lab can start programs outside it (that's how `distrobox-host-exec` works).
- **`lupi lab root` runs as the real root, with `--privileged`:** anything in it can take over
  the whole PC. Use it only for the tools that need it.

Treat the lab like any program you run: don't run untrusted binaries, exploits you haven't
read, or malware samples in it. Use a separate virtual machine for those.

### Strict lab: `lupi lab strict`

The same Kali image, run by plain `podman` instead of distrobox, for when you'd rather the tools
couldn't see your PC: running an exploit or script you downloaded, or a tool you don't trust yet.

- **It shares one folder and nothing else:** `~/LupiLab/lupi-lab-strict` on your PC is `/root/shared`
  in the strict lab. No home folder, no `/run/host`, no desktop session, no session bus.
- **SELinux confines it** (`container_t`; distrobox turns SELinux off for its boxes). Even a process
  that breaks out of the container is still blocked from your files.
- **It runs rootless:** "root" inside is your own user outside, with no extra privileges.
- It has its own network (podman's user-mode network): it reaches the internet and your LAN like
  any app does, and can't capture or change your PC's own network traffic.
- Run one command with `lupi lab strict <command>`, e.g. `lupi lab strict nmap -sT 192.168.1.1`.
  Get the newest image with `lupi lab reset strict`.

**Can't do:** windowed tools (Burp Suite, Wireshark's window), Wi-Fi tools, and scans that need
raw access to your network card (`nmap -sS`, OS detection). Use `lupi lab` or `lupi lab root` for those.

**Still not a virtual machine:** it shares the Linux kernel with your PC, so an attack on the kernel
itself could escape it. For real malware, use a separate virtual machine.

## Not included (and why)

| Thing | Why not |
|---|---|
| hardened_malloc | Crashes many Electron apps (Discord, VS Code). Too disruptive for a daily driver |
| Blocking unprivileged user namespaces | Breaks Flatpak and browser sandboxes unless done with custom SELinux policy |
| `lockdown=confidentiality` | Breaks hibernation and some drivers. Secure Boot already enables `integrity` mode |

## Reporting a security problem

Open an issue at https://github.com/vukkz/lupios/issues, or for anything sensitive
use GitHub's private vulnerability reporting on the repo's **Security** tab.
