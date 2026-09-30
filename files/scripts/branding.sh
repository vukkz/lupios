#!/usr/bin/env bash
# Rename the OS to Wolf OS (shown in the boot menu, fastfetch, system settings).
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

set_field NAME "Wolf OS"
# No number in the name: Wolf OS updates continuously, and 44 is the Fedora version underneath.
# It stays in VERSION_ID, which tools read (wolf channel builds the image tag from it).
set_field PRETTY_NAME "Wolf OS"
set_field HOME_URL "https://github.com/vukkz/wolf-os"
set_field BUG_REPORT_URL "https://github.com/vukkz/wolf-os/issues"
set_field DEFAULT_HOSTNAME "wolf-os"
set_field LOGO "wolf-os-logo" # icon installed by look.sh

cat "$file"
