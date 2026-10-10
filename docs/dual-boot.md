# Keeping Windows: LupiOS on a second SSD

The safest way to have both: each system on its own SSD, and you pick one when the PC starts.
Neither system's installer ever touches the other's disk. This page is the long version of the box
at the top of the [install guide](install.md); do these steps around it.

## Before: on Windows

1. **Back up your files.** Installing to the wrong disk erases it, and the installer can't undo that.
2. **Save the BitLocker recovery key**, if Windows uses BitLocker (Settings → Privacy & security →
   Device encryption, or account.microsoft.com/devices/recoverykey). Changing Secure Boot or the
   boot order can make Windows ask for it. Write it down somewhere that isn't this PC.
3. **Turn off Fast Startup** (Control Panel → Power Options → "Choose what the power buttons do" →
   untick "Turn on fast startup"). With it on, Windows doesn't really shut down, which can confuse
   the firmware's boot menu and leaves Windows' disks locked.
4. **Find your boot menu key**: search for your motherboard or PC model and "boot menu key"
   (often F12, F11 or F8).
5. **Note your graphics card**: Task Manager → Performance → GPU. An NVIDIA GTX 16xx, RTX 20xx or
   newer means `lupios-nvidia.iso`; anything else, including older NVIDIA cards, `lupios.iso`.

## Install

1. **Fit the new SSD.** Then, to make it impossible to pick the wrong disk, **unplug the Windows
   SSD** (or its cable) while you install. Optional, but it removes the biggest risk.
2. Follow the [install guide](install.md) from step 2. In **Installation Destination**, the new SSD
   is the empty one; check its size. Tick **Encrypt my data**.
3. On the first boot, **enroll the MOK** (the blue screen, password `universalblue`). On an NVIDIA
   PC this matters most: without it, Secure Boot blocks the NVIDIA driver and the desktop runs
   slowly on the basic display driver.
4. Plug the Windows SSD back in.

## Switching between them

- **The boot menu key** at startup lists both: "Fedora" or "LupiOS" (on the new SSD) and "Windows
  Boot Manager". Pick one each time.
- **Or set the default** in the firmware settings (Boot order / Boot priority): put the one you
  use most first.

**The clock is off by a few hours after switching?** Windows keeps the PC's hardware clock in
local time, Linux in UTC. The cleanest fix is on Windows: tell it to use UTC as well (search
"Windows RealTimeIsUniversal"). Or tell LupiOS to use local time: `sudo timedatectl set-local-rtc 1`.

## First checks on real hardware

These can't be tested in a virtual machine, so they're the most useful to report back:

1. `lupi check`: everything ✔, including **Secure Boot** and **Disk encryption**.
2. **NVIDIA:** `nvidia-smi` shows your card. System Settings → About this System shows it as the
   graphics processor.
3. **Wi-Fi trust:** connect to your Wi-Fi. A "New network" message should say it's treated as
   PUBLIC. At home, run `lupi net home` (or use the wolf icon next to the clock).
4. **Kernel hardening:** about 5 minutes after the first start, the "Kernel hardening added"
   message appears. Restart, then `lupi kargs` says ON.
5. **Gaming:** `lupi setup gaming`, sign in to Steam, start a game. Then try `lupi game on` and
   check that it still runs (and `lupi game off` afterwards).
6. **Sleep and wake:** close the lid or choose Sleep, then wake it. NVIDIA cards are the most
   likely to have trouble here.
7. **The Lab:** `lupi lab` and `lupi lab strict` (the first one downloads a few GB).

Anything that fails: open an issue with the output of `lupi check` and a photo of the screen.
