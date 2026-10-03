---
title: FAQ
description: The name, the Fedora base, the 6 GB download, the password on first boot, and more.
---

## What does the name mean?

*Lupi* is Italian for "wolves": a pack. You control it all with the `lupi` command, and its two
security levels are **sheep** and **wolf**. A sheep is calm and just grazing: that's the everyday
default, with every protection on and nothing in your way. A wolf is alert and on the hunt: that's
maximum caution, for travel and public places.

## Why is it based on Fedora?

Almost every distro is built on another one: Ubuntu on Debian, Mint on Ubuntu. Keeping thousands of
packages patched against new security holes takes a large team, and Fedora has one. LupiOS uses
**Fedora Atomic**, where the whole system is one image that updates at once and can roll back, with
SELinux on by default. [Universal Blue](https://universal-blue.org) adds codecs and drivers, like
NVIDIA's.

LupiOS adds what Fedora doesn't do: the hardening, network trust, the lab, Game Mode, the `lupi`
command and the look. You get Fedora's fast security fixes without giving any of that up.

## Is it a hacking distro, like Kali?

No. Kali is a toolbox you boot for a job. LupiOS is the OS you use every day, and it carries Kali's
tools with it in the [Lupi Lab](../lupi/#hacking-lab), a container you open with `lupi lab`. The
tools never touch your system. For malware samples or anything untrusted, use a separate virtual
machine.

## Why is the download 6 GB? Arch's is under 2.

The LupiOS ISO holds the **whole finished system**: the KDE desktop, drivers, codecs, firmware and
the LupiOS changes. The installer copies it onto your disk in one go, without needing the internet.
Arch's ISO is a small starter system that downloads most of the system while you install, so the ISO
is only part of what you end up downloading. LupiOS does it all up front. The NVIDIA version is
bigger because it includes the NVIDIA driver.

## Why does it ask for a password on the first boot?

After installing, a blue **MOK management** screen asks you to enroll a key, with the password
`universalblue`. Secure Boot only lets drivers load if they're signed by a key your PC trusts. Some of
LupiOS's drivers are signed by Universal Blue: NVIDIA's driver, Xbox controller drivers (xone,
xpadneo), a virtual webcam driver (v4l2loopback), Razer device support (openrazer) and Broadcom
Wi-Fi (wl). Enrolling adds Universal Blue's key to your PC, once.

The password isn't a secret: everyone uses the same one. It's there so that only someone sitting at
the PC can add a key, not a program running in the background. If you miss the screen (it has a
10-second timer), run `ujust enroll-secure-boot-key` and restart.

## Does Secure Boot work?

Yes, and it can stay on while you install. `lupi check` shows a full score only with Secure Boot on.

## Can I play games on it?

Yes. `lupi setup gaming` installs Steam, Heroic, Lutris, ProtonUp-Qt and MangoHud, and
[Game Mode](../lupi/#gaming) (`lupi game on`) gets the PC ready to play. Most Windows games run through
Proton. Games whose anti-cheat refuses Linux don't run on any Linux, LupiOS included.

## How do updates work?

LupiOS updates itself in the background, and the new version starts at your next restart. If an
update ever breaks something, choose the **second entry** in the boot menu: that's the previous
version, exactly as it was. `lupi update` updates the system, apps and boxes right away (the new
system version still starts at the next restart).

## Can I keep Windows?

Yes. The safest way is to install LupiOS on **its own SSD**, so Windows is never touched, and pick
the system in your PC's boot menu. Back up your files first, and if Windows uses BitLocker, save the
recovery key: changing boot settings can make Windows ask for it. The [install guide](../install/)
covers this.

## Who makes it?

LupiOS is a young, one-person project, built in the open on
[GitHub](https://github.com/vukkz/lupios). Try it in a virtual machine first, and report anything
that breaks in the [issues](https://github.com/vukkz/lupios/issues).
