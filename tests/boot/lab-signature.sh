#!/usr/bin/env bash
# Runs in a container of the LupiOS image, as root (boot-test.yml): does the image's own podman setup
# (/etc/containers) accept the published Lupi Lab image, and only because of its LupiOS signature?
# --multi-arch=index-only copies just the small image list, not the Lab itself: the signature is
# checked before anything is copied, so this downloads almost nothing.
set -euo pipefail

LAB=ghcr.io/vukkz/lupios-lab
copy() { skopeo "$@" copy --multi-arch=index-only --remove-signatures "docker://$LAB:latest" "oci:$(mktemp -d)"; }

echo "== The Lab image, signed by LupiOS: must be accepted"
copy

echo "== The same image, but the rule expects another key (Universal Blue's): must be refused"
jq --arg lab "$LAB" '.transports.docker[$lab][0].keyPath = "/etc/pki/containers/ublue-os.pub"' \
    /etc/containers/policy.json >/tmp/other-key.json
if copy --policy /tmp/other-key.json; then
    echo "::error::The Lab image was accepted with the wrong key: its signature isn't checked"
    exit 1
fi
echo "Refused, as it should be."
