#!/usr/bin/env bash
# Rechunking (build.yml: build_chunked_oci) splits LupiOS into layers by package, so an update only
# downloads the layers that changed. Files that belong to no package all share one ~300 MB layer,
# downloaded again whenever any one of them changes. Measured on 2026-10-07, these change for
# different reasons, so each gets a layer of its own (rpm-ostree reads the user.component attribute):
# - the package database (both copies: the current one, and rpm-ostree's copy of the base image's):
#   changes with every build, since it records install times. ~78 MB compressed.
# - the font caches: rebuilt, slightly differently, by every build
# The boot image (initramfs) can't be moved: rpm-ostree always keeps it with the unpackaged files, and
# ignores the attribute (checked 2026-10-07). It only changes with the kernel, dracut or the boot screen.
set -euo pipefail

component() { # <name> <path>: tags the path and everything in it
    [[ -e $2 && ! -L $2 ]] || return 0
    find "$2" -xdev \( -type f -o -type d \) -print0 |
        xargs -0 python3 -c 'import os, sys; [os.setxattr(p, "user.component", sys.argv[1].encode()) for p in sys.argv[2:]]' "$1"
    echo "$1: $2 ($(du -sh "$2" | cut -f1))"
}

component rpmdb /usr/share/rpm
component rpmdb /usr/lib/sysimage/rpm
component rpmdb /usr/lib/sysimage/rpm-ostree-base-db
component fontconfig-cache /usr/lib/fontconfig/cache
