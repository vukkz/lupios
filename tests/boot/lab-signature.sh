#!/usr/bin/env bash
# Runs in a container of the LupiOS image, as root (boot-test.yml): does the image's own podman setup
# (/etc/containers) accept the published Lupi Lab image, and only because of its LupiOS signature?
# Like podman pull, skopeo checks the signature of the image for this PC (amd64), not the list it
# comes in: copying only the list (--multi-arch=index-only) skips the check entirely.
set -euo pipefail

LAB=docker://ghcr.io/vukkz/lupios-lab:latest

# Refused before anything is downloaded, so this one is quick
echo "== The Lab image, but the rule expects another key (Universal Blue's): must be refused"
jq '.transports.docker["ghcr.io/vukkz/lupios-lab"][0].keyPath = "/etc/pki/containers/ublue-os.pub"' \
    /etc/containers/policy.json >/tmp/other-key.json
if out=$(skopeo --policy /tmp/other-key.json copy "$LAB" "dir:$(mktemp -d)" 2>&1); then
    echo "::error::The Lab image was accepted with the wrong key: its signature isn't checked"
    exit 1
fi
echo "$out"
if [[ $out != *"Source image rejected"* ]]; then
    echo "::error::The copy failed, but not because of the signature"
    exit 1
fi

echo "== The Lab image, signed by LupiOS: must be accepted (this downloads it)"
skopeo copy --remove-signatures "$LAB" "dir:$(mktemp -d -p /var/tmp)"
