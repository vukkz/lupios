#!/usr/bin/env bash
# The Lupi Lab image (lab/Containerfile) is signed with the same key as LupiOS itself. Tell podman to
# check that: a Lab image without a valid LupiOS signature is refused instead of run. Without this
# rule podman accepts any image from anywhere, so a hijacked registry account could hand out a
# Lab with a backdoor. Runs after BlueBuild's signing module, which writes the OS image's own rule.
set -euo pipefail

POLICY=/etc/containers/policy.json
LAB=ghcr.io/vukkz/lupios-lab

# The OS image's rule (ghcr.io/vukkz/lupios, or lupios-nvidia): same key, so the Lab gets a copy
os_rule=$(jq -c '[.transports.docker | to_entries[] | select(.key | test("^ghcr.io/vukkz/lupios(-nvidia)?$")) | .value][0] // empty' "$POLICY")
[[ -n $os_rule ]] || { echo "No LupiOS signing rule in $POLICY: did the signing module run first?" >&2; exit 1; }

jq --arg lab "$LAB" --argjson rule "$os_rule" '.transports.docker[$lab] = $rule' "$POLICY" >"$POLICY.new"
mv "$POLICY.new" "$POLICY"
jq --arg lab "$LAB" '.transports.docker[$lab]' "$POLICY"
