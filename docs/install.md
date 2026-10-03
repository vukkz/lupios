# Installing LupiOS

About 30 minutes, most of it waiting. Read it once all the way through before you start.

## What you need

- **A USB stick of 8 GB or more.** Everything on it gets erased.
- **A 64-bit PC with at least 8 GB of RAM** and an SSD with **64 GB or more** for LupiOS.
- **Internet during setup.** Some apps download on first boot.

> **Keeping Windows?** Install LupiOS on its **own SSD**. That's by far the safest way: Windows
> is never touched, and you pick the system in your PC's boot menu. Before changing anything:
> - Back up your files.
> - If Windows uses BitLocker, save the **BitLocker recovery key**
>   (account.microsoft.com/devices/recoverykey). Changing boot settings can make Windows ask for it.

## 1. Pick your ISO

| Your graphics card | ISO |
|---|---|
| NVIDIA (GeForce, RTX, GTX) | `lupios-nvidia.iso` |
| AMD, Intel, or a virtual machine | `lupios.iso` |

On Windows, you can check your graphics card in Task Manager → Performance → GPU.

## 2. Put it on the USB stick

1. Install **[Fedora Media Writer](https://fedoraproject.org/workstation/download)** (Windows and Mac)
   or **[balenaEtcher](https://etcher.balena.io)**.
2. Choose **"Select .iso file"**, pick the LupiOS ISO, pick your USB stick, and write it.

*Optional:* to check the download isn't damaged, run this in Windows PowerShell and compare the
result with the `-CHECKSUM` file that came with the ISO:
`Get-FileHash .\lupios.iso -Algorithm SHA256`

## 3. Boot from the USB stick

1. Plug the stick in and restart.
2. As the PC starts, press the **boot menu key**, usually **F12, F11, F8 or Esc**. It depends on
   the brand: search for your PC or motherboard model and "boot menu key".
3. Pick the USB stick. If it's listed twice, pick the one that says **UEFI**.

**Secure Boot can stay on.** If the stick won't boot at all, turn Secure Boot off in the firmware
settings, install, then turn it back on after step 5.

## 4. Install

1. Choose **Install lupios 44** (the first entry) and your language.
2. **Installation Destination:**
   - Pick the disk for LupiOS. **Double-check it's not your Windows disk.**
   - Leave storage on **Automatic**.
   - Tick **Encrypt my data** and choose a passphrase. You'll type it at every boot, and there's
     no way to recover it if you forget it.
3. The installer doesn't ask for a user name or password. You create your user on the first start.
4. Click **Begin Installation**, wait, then **Reboot** and take the USB stick out.

## 5. First boot

1. **A blue "MOK management" screen may appear.** It lets LupiOS's drivers work with Secure Boot,
   and it only shows once. **Be quick, it has a 10-second timer.**
   1. Choose **Enroll MOK**, then **Continue**, then **Yes**.
   2. Type the password **`universalblue`** (nothing appears while you type), then choose **Reboot**.

   If you miss the timer, run `ujust enroll-secure-boot-key` later and reboot.
2. Type your disk passphrase.
3. KDE asks you to create your user. This first user is the administrator: it can install
   software and change system settings.
4. **LupiOS Welcome** opens and walks you through your security level, gaming and the Lab.

## 6. One restart to finish

About 5 minutes after you start LupiOS, it adds extra kernel hardening by itself, and a
**"Kernel hardening added"** message pops up. Restart once after that message. Then open the
terminal (**Konsole**) and run:

```bash
lupi check
```

You should see ✔ on everything, and a full score if Secure Boot is on.

## If something goes wrong

- **An update broke something:** restart and pick the **second entry** in the boot menu. That's the
  previous version.
- **`lupi lab` says `crun: ptsname: Inappropriate ioctl for device`:** the lab's first setup was
  interrupted. Run `podman stop lupi-lab`, then `lupi lab` again and let it finish.
- **Anything else:** open an issue at https://github.com/vukkz/lupios/issues with a photo of the screen.
