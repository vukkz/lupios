#!/usr/bin/env bash
# Rechunking (build.yml: build_chunked_oci) splits LupiOS into layers by package, so an update only
# downloads the layers that changed. Files that belong to no package all share one ~260 MB layer with
# the boot image, downloaded again whenever any one of them changes. These change for their own
# reasons, so each group gets a layer of its own (rpm-ostree reads the user.component attribute):
# - the package database (both copies: the current one, and rpm-ostree's copy of the base image's):
#   changes with every build, since it records install times. ~78 MB compressed.
#   dnf's transaction history (/usr/lib/sysimage/libdnf5) joins it: it records every build's installs
#   with their time, and otherwise kept a 45 MB layer of dnf's own packages changing (found 2026-10-09).
# - the font caches: rebuilt, slightly differently, by every build
# - LupiOS's own files (files/system, copied to / by the files module): they change with LupiOS
#   updates, and in the shared layer a one-line change to lupi re-downloaded the boot image too.
# The boot image (initramfs) can't be moved: rpm-ostree always keeps it with the unpackaged files, and
# ignores the attribute (checked 2026-10-07). It only changes with the kernel, dracut or the boot screen.
# shellcheck disable=SC2154 # CONFIG_DIRECTORY comes from BlueBuild (/tmp/files: the repo's files/ folder)
set -euo pipefail

tag() { # <name> <path>...: tags each path, and everything in the folders among them
    local name=$1
    shift
    find "$@" -xdev \( -type f -o -type d \) -print0 |
        xargs -0 python3 -c 'import os, sys; [os.setxattr(p, "user.component", sys.argv[1].encode()) for p in sys.argv[2:]]' "$name"
}
component() { # <name> <path>
    [[ -e $2 && ! -L $2 ]] || return 0
    tag "$1" "$2"
    echo "$1: $2 ($(du -sh "$2" | cut -f1))"
}

component rpmdb /usr/share/rpm
component rpmdb /usr/lib/sysimage/rpm
component rpmdb /usr/lib/sysimage/rpm-ostree-base-db
component rpmdb /usr/lib/sysimage/libdnf5
component fontconfig-cache /usr/lib/fontconfig/cache

# Every file the files module copied from files/system (CONFIG_DIRECTORY is BlueBuild's files/ folder)
own=()
while IFS= read -r -d '' f; do
    path=/${f#"$CONFIG_DIRECTORY"/system/}
    [[ -f $path && ! -L $path ]] && own+=("$path")
done < <(find "$CONFIG_DIRECTORY/system" -type f ! -name .gitkeep -print0)
((${#own[@]})) || { echo "No LupiOS files found under $CONFIG_DIRECTORY/system" >&2; exit 1; }
tag lupios "${own[@]}"
echo "lupios: ${#own[@]} files from files/system"
