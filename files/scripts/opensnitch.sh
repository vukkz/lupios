#!/usr/bin/env bash
# OpenSnitch: the per-app firewall behind `wolf outgoing` (apps ask before they connect).
# It isn't in Fedora's repos, so install the official release, pinned to a version and checked
# against GitHub's published checksums: if the files ever change, the build fails instead of
# shipping them. To update: bump VERSION and copy the new sha256 values from
#   gh api repos/evilsocket/opensnitch/releases/latest --jq '.assets[] | "\(.name) \(.digest)"'
set -euo pipefail

VERSION=1.8.0
URL=https://github.com/evilsocket/opensnitch/releases/download/v$VERSION
declare -A SHA256=(
    ["opensnitch-$VERSION-1.x86_64.rpm"]=e06e9119daf764e56455b61c319e496274c0274bb53bb94a0ff1ab72967fea7d
    ["opensnitch-ui-$VERSION-1.noarch.rpm"]=e5527b6b0040f771cd5345d4917269f0fe98b6d06064bae15f4ab937e45b4a08
)

dir=$(mktemp -d)
for rpm in "${!SHA256[@]}"; do
    curl -fsSL --retry 3 -o "$dir/$rpm" "$URL/$rpm"
    echo "${SHA256[$rpm]}  $dir/$rpm" | sha256sum -c -
done

# The UI only "recommends" grpcio and protobuf, but it can't talk to the daemon without them
dnf -y install "$dir"/*.rpm python3-grpcio python3-protobuf
rm -rf "${dir:?}"

# The package turns the daemon on for everyone. Wolf OS ships it off: `wolf outgoing on`
# (or the sheep level) turns it on, and /etc/xdg/autostart starts the pop-up app only then.
systemctl disable opensnitch.service
