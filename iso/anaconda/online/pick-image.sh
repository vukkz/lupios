#!/usr/bin/env bash
# Runs in the online installer before setup starts (kickstart %pre, see ../lupios-online.tmpl):
# picks the LupiOS version for this PC and writes the kickstart lines that install it.
# Usage: lupios-pick-image <repo> <tag>, e.g. ghcr.io/vukkz latest
set -euo pipefail
repo=$1 tag=$2

# lupios-nvidia's driver is NVIDIA's open kernel module, which only supports Turing (2018: GTX 16xx,
# RTX 20xx) and newer. Their PCI device IDs start at 0x1e00. Older NVIDIA cards get lupios, which
# drives them with nouveau. Laptops with Intel/AMD and NVIDIA graphics get lupios-nvidia too.
image=lupios
for dev in /sys/bus/pci/devices/*; do
    [[ $(<"$dev/vendor") == 0x10de && $(<"$dev/class") == 0x03* ]] || continue # NVIDIA graphics
    if (($(<"$dev/device") >= 0x1e00)); then image=lupios-nvidia; fi
done

# lupios.image=lupios or lupios.image=lupios-nvidia on the boot line (press e in the boot menu) wins
read -ra args </proc/cmdline
for arg in "${args[@]}"; do
    case $arg in
        lupios.image=lupios | lupios.image=lupios-nvidia) image=${arg#*=} ;;
    esac
done
echo "LupiOS online installer: installing $repo/$image:$tag"

# The download is checked: /etc/containers/policy.json here only accepts images signed with LupiOS's
# key. bootc switch then records the image the same way the full ISOs do, so the installed system
# checks the signature of every update.
cat >/tmp/lupios-source.ks <<KS
ostreecontainer --url=$repo/$image:$tag --transport=registry
%post --erroronfail
bootc switch --mutate-in-place --enforce-container-sigpolicy --transport registry $repo/$image:$tag
%end
KS
