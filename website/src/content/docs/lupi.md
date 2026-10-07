---
title: The lupi command
description: One command for apps, updates, security levels, networks, gaming and the lab.
---

Everything LupiOS adds is controlled by one command, `lupi`, in the terminal (**Konsole**). Press
<kbd>Tab</kbd> to complete commands, and run `lupi help` to see them all. Leave out the part in
`[brackets]` to see the current state, so `lupi net` tells you how the network you're on is trusted.

You don't need the terminal for the everyday switches: click **the wolf next to the clock** to change
your security level, network trust and Game Mode, and to see your security score.

## Software

| Command | What it does |
|---|---|
| `lupi install <name>` | Installs an app from Flathub, or a command-line tool from Arch Linux. It picks the right one |
| `lupi remove <name>` | Removes it again (and closes the app if it's running) |
| `lupi search <name>` | Looks for apps and tools |
| `lupi update` | Updates the system, apps and boxes. Restart afterwards if it says so |
| `lupi channel [stable\|testing]` | Which updates you get. *testing* gets new changes first |

Apps from Flathub run in a sandbox; see or change what each one may do in **Flatseal**. Command-line
tools go into a box called `lupi-tools`, so they stay off the system image. Nothing is installed
into the system itself.

## Security

| Command | What it does |
|---|---|
| `lupi check` | Shows how locked-down this PC is, with a score |
| `lupi level [sheep\|wolf]` | Your security level: **sheep** is the calm everyday default, **wolf** is maximum caution |
| `lupi net [home\|public]` | Trust for the network you're on. New Wi-Fi networks start as **public** |
| `lupi kargs [on\|off]` | Kernel hardening at boot. LupiOS turns it on by itself after installing |
| `lupi usbguard [on\|off]` | Blocks USB devices plugged in after you turn it on (on in wolf) |
| `lupi outgoing [on\|off]` | Apps ask before they connect to the internet (on in wolf) |

What each level and setting changes, and what it can break, is all in [Security](../security/).

## Gaming

| Command | What it does |
|---|---|
| `lupi setup gaming` | Installs Steam, Heroic, Lutris, ProtonUp-Qt and MangoHud |
| `lupi game [on\|off]` | Game Mode: opens Steam Remote Play on home networks, fixes stutter in some games, pauses updates and switches to the performance power profile. Off again at restart |

## Hacking lab

| Command | What it does |
|---|---|
| `lupi lab` | Enters the Lupi Lab: Kali's top tools in a container. The first time downloads a few GB and sets it up: let it finish |
| `lupi lab root` | The lab as the real root, with raw network access, for scans and Wi-Fi tools that need it |
| `lupi lab strict [command]` | The strict lab: the same tools, but it can't see your files or your desktop. Terminal tools only |
| `lupi lab reset [root\|strict]` | Starts that lab fresh from the newest image |

Tools start in their own home folder, `~/LupiLab`. The lab keeps them off your system, but it is
**not a sandbox**: your real home folder and your desktop session are shared with it, and the root
lab can take over the whole PC. For tools or scripts you don't trust yet, use the **strict lab**: it
only shares `~/LupiLab/lupi-lab-strict` (`/root/shared` inside), and SELinux keeps it away from
everything else. For real malware, use a separate virtual machine.
[What each lab does and doesn't protect](../security/#lupi-lab-lupi-lab).

## Terminal

| Command | What it does |
|---|---|
| `lupi fastfetch [on\|off]` | The wolf and your system info at the top of new terminals |
| `lupi prompt [on\|off]` | The icy terminal prompt |

## And LupiOS Welcome

On your first login, **LupiOS Welcome** walks you through your security level, gaming and the lab.
Open it again any time from the app menu: *Welcome Center*.
