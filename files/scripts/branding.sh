#!/usr/bin/env bash
# Rename the OS to LupiOS (shown in the boot menu, fastfetch, system settings).
# ID stays "fedora" on purpose so Fedora tooling (dnf, toolbox, flatpak) keeps working.
set -euo pipefail

file=$(readlink -f /usr/lib/os-release) # Fedora symlinks this to a per-edition file

set_field() {
    local key=$1 value=$2
    if grep -q "^${key}=" "$file"; then
        sed -i "s|^${key}=.*|${key}=\"${value}\"|" "$file"
    else
        echo "${key}=\"${value}\"" >>"$file"
    fi
}

set_field NAME "LupiOS"
# No number in the name: LupiOS updates continuously, and 44 is the Fedora version underneath.
# It stays in VERSION_ID, which tools read (lupi channel builds the image tag from it).
set_field PRETTY_NAME "LupiOS"
set_field HOME_URL "https://lupios.org"
set_field DOCUMENTATION_URL "https://lupios.org" # Fedora's pointed to the Fedora Kinoite docs
set_field SUPPORT_URL "https://github.com/vukkz/lupios/issues" # and this to Ask Fedora
set_field BUG_REPORT_URL "https://github.com/vukkz/lupios/issues"
set_field DEFAULT_HOSTNAME "lupios"
set_field LOGO "lupios-logo" # icon installed by look.sh

cat "$file"
