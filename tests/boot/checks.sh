#!/usr/bin/env bash
# LupiOS boot test: runs inside the test VM, as root, right after boot (see lupios-ci.service).
# Prints one "LUPIOS-CI" line per check to the serial console; the workflow reads them back and
# fails the build unless the last line says PASS.
set -uo pipefail

fails=0
ok() { echo "LUPIOS-CI ok    $1"; }
bad() { echo "LUPIOS-CI FAIL  $1"; fails=$((fails + 1)); }
# check NAME COMMAND...: passes when the command succeeds
check() {
    local name=$1 out
    shift
    if out=$("$@" 2>&1); then ok "$name"; else bad "$name: $(tr '\n' ' ' <<<"$out" | cut -c1-400)"; fi
}
# expect NAME WANTED COMMAND...: passes when the command prints exactly WANTED
expect() {
    local name=$1 want=$2 got
    shift 2
    got=$("$@" 2>&1)
    if [[ $got == "$want" ]]; then ok "$name: $got"; else bad "$name: wanted '$want', got '$(tr '\n' ' ' <<<"$got" | cut -c1-200)'"; fi
}

echo "LUPIOS-CI start, $(cut -d' ' -f1 /proc/uptime) s after boot"

# Let the rest of the boot finish (every queued job except this one), for at most 5 minutes
for _ in $(seq 150); do
    [[ -z $(systemctl list-jobs --no-legend | grep -v lupios-ci) ]] && break
    sleep 2
done
systemctl list-jobs --no-legend | grep -v lupios-ci | sed 's/^/LUPIOS-CI note  still starting: /'

expect "it is LupiOS" "LupiOS" bash -c '. /etc/os-release && echo "$NAME"'
expect "SELinux" "Enforcing" getenforce
expect "firewall default zone" "lupios" firewall-cmd --get-default-zone
expect "display manager" "active" systemctl is-active display-manager
# systemd and NetworkManager run lupi with almost no environment: this broke it once for 3 days
check "lupi runs without \$HOME" env -i PATH=/usr/bin:/bin lupi help
check "lupi state" lupi state
check "lupi check runs" lupi-security-check
# What lupios-kargs.timer does 5 minutes after the first boot, started right away here
check "kernel hardening service" systemctl start lupios-kargs.service
check "kernel hardening added" bash -c 'rpm-ostree kargs --deploy-index=0 | grep -q init_on_alloc=1'

# Units that can only work on real hardware, so they fail in every VM:
# mcelog listens for the processor's hardware error reports, which a virtual CPU doesn't send.
vm_only="mcelog.service"
failed=$(systemctl --failed --no-legend --plain | awk '{print $1}' | grep -v lupios-ci | grep -vxF "$vm_only" | tr '\n' ' ')
if [[ -z $failed ]]; then ok "no failed units (ignoring, in a VM: $vm_only)"; else bad "failed units: $failed"; fi

lupi-security-check 2>&1 | sed 's/\x1b\[[0-9;]*m//g; s/^/LUPIOS-CI info  /'

if ((fails == 0)); then echo "LUPIOS-CI: PASS"; else echo "LUPIOS-CI: FAIL ($fails)"; fi
