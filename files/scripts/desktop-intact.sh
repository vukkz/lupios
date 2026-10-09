#!/usr/bin/env bash
# Runs first in the script module, right after the dnf module. Removing a package with dnf also
# removes everything that depends on it, including through features a package only "provides", which
# `rpm -q --whatrequires` doesn't show. Removing Fedora's wallpapers once took the whole KDE desktop
# and the login screen with it (2026-10-09). Stop the build here if the desktop is gone, with a clear
# reason, instead of shipping an image that boots to nothing.
set -euo pipefail

required=(plasma-workspace plasma-desktop plasma-login-manager kde-settings-plasma konsole dolphin)
missing=()
for pkg in "${required[@]}"; do
    rpm -q "$pkg" >/dev/null 2>&1 || missing+=("$pkg")
done
if ((${#missing[@]})); then
    echo "The desktop is incomplete: ${missing[*]} got removed, probably by a package in the dnf module's" >&2
    echo "remove list. Check a removal first with: rpm -e --test <package>" >&2
    exit 1
fi
echo "Desktop intact: ${required[*]}"
