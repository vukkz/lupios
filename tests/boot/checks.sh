#!/usr/bin/env bash
# LupiOS boot test: runs inside the test VM, as root, right after boot (see lupios-ci.service).
# Prints one "LUPIOS-CI" line per check to the serial console; the workflow reads them back and
# fails the build unless the last line says PASS.
#
# Besides "does it start", it checks every promise SECURITY.md makes, in that file's order. The
# promised values are written out here on purpose instead of being read from the image's files:
# a change that drops a setting fails this test until the setting is dropped here too, on purpose.
set -uo pipefail

fails=0
ok() { echo "LUPIOS-CI ok    $1"; }
bad() { echo "LUPIOS-CI FAIL  $1"; fails=$((fails + 1)); }
oneline() { tr '\n' ' ' <<<"$1" | cut -c1-"${2:-400}"; }
# check NAME COMMAND...: passes when the command succeeds
check() {
    local name=$1 out
    shift
    if out=$("$@" 2>&1); then ok "$name"; else bad "$name: $(oneline "$out")"; fi
}
# refuse NAME COMMAND...: passes when the command fails (something LupiOS promises to block)
refuse() {
    local name=$1 out
    shift
    if out=$("$@" 2>&1); then bad "$name: it worked, and it shouldn't: $(oneline "$out" 200)"; else ok "$name"; fi
}
# expect NAME WANTED COMMAND...: passes when the command prints exactly WANTED
expect() {
    local name=$1 want=$2 got
    shift 2
    got=$("$@" 2>&1)
    if [[ $got == "$want" ]]; then ok "$name: $got"; else bad "$name: wanted '$want', got '$(oneline "$got" 200)'"; fi
}
# retry NAME COMMAND...: like check, with a few tries over 15 seconds (for things that use the internet)
retry() {
    local name=$1 out
    shift
    for _ in 1 2 3 4 5; do
        if out=$("$@" 2>&1); then ok "$name"; return; fi
        sleep 3
    done
    bad "$name: $(oneline "$out")"
}
# sysctls NAME KEY=VALUE...: passes when every kernel setting has the promised value
sysctls() {
    local name=$1 pair key got wrong=()
    shift
    for pair in "$@"; do
        key=${pair%%=*}
        got=$(sysctl -n "$key" 2>&1)
        [[ $got == "${pair#*=}" ]] || wrong+=("$key=$got (wanted ${pair#*=})")
    done
    if ((${#wrong[@]} == 0)); then ok "$name ($# settings)"; else bad "$name: ${wrong[*]}"; fi
}
# How the panel widget and LupiOS Welcome run lupi: as root through pkexec, which sets PKEXEC_UID
widget() { env PKEXEC_UID=1000 lupi "$@"; }

echo "LUPIOS-CI start, $(cut -d' ' -f1 /proc/uptime) s after boot"

# Let the rest of the boot finish (every queued job except this one), for at most 5 minutes
for _ in $(seq 150); do
    [[ -z $(systemctl list-jobs --no-legend | grep -v lupios-ci) ]] && break
    sleep 2
done
systemctl list-jobs --no-legend | grep -v lupios-ci | sed 's/^/LUPIOS-CI note  still starting: /'

# --- It starts, and it's LupiOS ----------------------------------------------------------------
expect "it is LupiOS" "LupiOS" bash -c '. /etc/os-release && echo "$NAME"'
expect "SELinux" "Enforcing" getenforce
expect "display manager" "active" systemctl is-active display-manager
# systemd and NetworkManager run lupi with almost no environment: this broke it once for 3 days
check "lupi runs without \$HOME" env -i PATH=/usr/bin:/bin lupi help
check "lupi state" lupi state
check "lupi check runs" lupi-security-check

# --- Updates -----------------------------------------------------------------------------------
policy=/etc/containers/policy.json
check "OS updates must be signed by LupiOS" jq -e \
    '[.transports.docker | to_entries[] | select(.key | test("^ghcr.io/vukkz/lupios(-nvidia)?$")) | .value[0].type] == ["sigstoreSigned"]' "$policy"
check "Lab images must be signed by LupiOS" jq -e '.transports.docker["ghcr.io/vukkz/lupios-lab"][0].type == "sigstoreSigned"' "$policy"
update_timers() { # the automatic-update timers that are running, on one line
    local t on=()
    for t in uupd.timer ublue-update.timer rpm-ostreed-automatic.timer flatpak-system-update.timer; do
        systemctl is-active --quiet "$t" && on+=("$t")
    done
    echo "${on[*]}"
}
updates=$(update_timers)
if [[ -n $updates ]]; then ok "automatic updates on: $updates"; else bad "automatic updates: no update timer is running"; fi

# --- Firewall ----------------------------------------------------------------------------------
expect "firewall default zone" "lupios" firewall-cmd --get-default-zone
expect "home zone lets in only DHCPv6 and mDNS" "dhcpv6-client mdns" firewall-cmd --zone=lupios --list-services
expect "home zone opens no ports" "" firewall-cmd --zone=lupios --list-ports
expect "public zone drops everything" "DROP" firewall-cmd --permanent --zone=lupios-public --get-target

# --- Kernel settings ---------------------------------------------------------------------------
sysctls "kernel hardening (sysctl)" \
    kernel.kptr_restrict=2 kernel.dmesg_restrict=1 \
    kernel.unprivileged_bpf_disabled=1 net.core.bpf_jit_harden=2 \
    kernel.kexec_load_disabled=1 dev.tty.ldisc_autoload=0 kernel.yama.ptrace_scope=1 \
    vm.mmap_rnd_bits=32 vm.mmap_rnd_compat_bits=16 \
    fs.protected_symlinks=1 fs.protected_hardlinks=1 fs.protected_fifos=2 fs.protected_regular=2 fs.suid_dumpable=0 \
    net.ipv4.conf.all.accept_redirects=0 net.ipv4.conf.default.accept_redirects=0 \
    net.ipv4.conf.all.secure_redirects=0 net.ipv4.conf.default.secure_redirects=0 \
    net.ipv6.conf.all.accept_redirects=0 net.ipv6.conf.default.accept_redirects=0 \
    net.ipv4.conf.all.send_redirects=0 net.ipv4.conf.default.send_redirects=0 \
    net.ipv4.conf.all.accept_source_route=0 net.ipv6.conf.all.accept_source_route=0 \
    net.ipv4.tcp_rfc1337=1 net.ipv4.tcp_syncookies=1 net.ipv4.icmp_echo_ignore_broadcasts=1

# --- Kernel boot arguments ---------------------------------------------------------------------
# What lupios-kargs.timer does 5 minutes after the first boot, started right away here
check "kernel hardening service" systemctl start lupios-kargs.service
next_kargs=" $(rpm-ostree kargs --deploy-index=0 2>&1 | tr '\n' ' ') "
missing=""
for arg in slab_nomerge init_on_alloc=1 page_alloc.shuffle=1 randomize_kstack_offset=on vsyscall=none; do
    [[ $next_kargs == *" $arg "* ]] || missing+=" $arg"
done
if [[ -z $missing ]]; then ok "kernel hardening added (5 boot arguments)"; else bad "kernel hardening missing:$missing"; fi
check "kernel hardening is added only once" test -e /var/lib/lupios/kargs-decided

# --- Blocked kernel modules --------------------------------------------------------------------
# Asked for by name, as root: they must not load. (Some no longer exist in Fedora's kernel at all.)
loaded=""
for m in dccp sctp rds tipc n-hdlc ax25 netrom x25 rose decnet econet af_802154 ipx appletalk psnap p8023 p8022 atm \
    firewire-core firewire-ohci firewire-sbp2 firewire-net vivid cramfs freevxfs jffs2 hfs; do
    modprobe "$m" >/dev/null 2>&1 && loaded+=" $m"
done
if [[ -z $loaded ]]; then ok "rare protocols, FireWire, vivid and old filesystems can't load"; else bad "these loaded:$loaded"; fi
check "Mac drives, discs and exFAT still work" modprobe -a hfsplus udf exfat

# --- Network privacy ---------------------------------------------------------------------------
nm_config=$(NetworkManager --print-config 2>&1)
missing=""
for want in hostname-mode=none wifi.scan-rand-mac-address=yes wifi.cloned-mac-address=stable ipv6.ip6-privacy=2; do
    grep -qxF "$want" <<<"$nm_config" || missing+=" $want"
done
if [[ -z $missing ]]; then ok "MAC address per network, temporary IPv6, networks can't rename the PC"; else bad "NetworkManager is missing:$missing"; fi
expect "the PC's name didn't come from the network" "lupios" cat /proc/sys/kernel/hostname

# --- Opt-in protections start off ----------------------------------------------------------------
expect "USBGuard off by default" "inactive" systemctl is-active usbguard
expect "outgoing guard off by default" "inactive" systemctl is-active opensnitch
refuse "Firefox isn't in the image (only the sandboxed Flatpak)" rpm -q firefox

# --- The widget and Welcome --------------------------------------------------------------------
expect "they ask for the password every time" "auth_admin auth_admin auth_admin" \
    bash -c "pkaction --action-id org.lupios.lupi --verbose | sed -n 's/^ *implicit [a-z]*: *//p' | paste -sd' '"
check "they can only run /usr/bin/lupi" bash -c \
    "pkaction --action-id org.lupios.lupi --verbose | grep -q 'org.freedesktop.policykit.exec.path -> /usr/bin/lupi$'"
# Through pkexec, lupi must refuse everything except the widget's switches. The timeout keeps a
# broken allowlist from hanging the test (lupi lab would start downloading the Lab).
for args in "lab" "lab reset" "fastfetch off" "level wolf now" ""; do
    out=$(PKEXEC_UID=1000 timeout 20 lupi $args 2>&1)
    if [[ $out == *"not available through pkexec"* ]]; then ok "pkexec refuses: lupi $args"; else bad "pkexec allowed 'lupi $args': $(oneline "$out" 200)"; fi
done

# --- Security levels ---------------------------------------------------------------------------
# Levels must never touch boot arguments or deployments (that would push out the rollback)
deployments() { rpm-ostree status --json | jq -c '[.deployments[].id]'; rpm-ostree kargs --deploy-index=0; }
before=$(deployments)
check "switch to wolf, as the widget does" widget level wolf --yes
expect "level remembered" "wolf" cat /etc/lupios/security-level
sysctls "wolf: io_uring, pings, SysRq, TCP timestamps off" \
    kernel.io_uring_disabled=2 net.ipv4.icmp_echo_ignore_all=1 kernel.sysrq=0 net.ipv4.tcp_timestamps=0
check "wolf: DNS goes encrypted to Quad9" bash -c \
    'resolvectl status | grep -q "+DNSOverTLS" && resolvectl dns | grep -q "^Global: 9.9.9.9#dns.quad9.net"'
# resolvectl dns prints "Link 2 (enp0s2): 10.0.2.3" while the network's DNS server is in use.
# The pause gives NetworkManager time to hand it back to systemd-resolved, if it was going to.
sleep 3
check "wolf: the network's DNS servers aren't used" bash -c '! resolvectl dns | grep -v "^Global" | grep -Eq ": *[0-9a-f]"'
retry "wolf: names still resolve (over TLS)" resolvectl query --cache=no fedoraproject.org
expect "wolf: USBGuard on" "active" systemctl is-active usbguard
expect "wolf: outgoing guard on" "active" systemctl is-active opensnitch

check "back to sheep, as the widget does" widget level sheep
sysctls "sheep: io_uring, pings, SysRq (sync only), TCP timestamps on" \
    kernel.io_uring_disabled=0 net.ipv4.icmp_echo_ignore_all=0 kernel.sysrq=16 net.ipv4.tcp_timestamps=1
retry "sheep: the network's DNS server again" bash -c 'resolvectl dns | grep -v "^Global" | grep -Eq ": *[0-9a-f]"'
retry "sheep: names resolve" resolvectl query --cache=no fedoraproject.org
expect "sheep: USBGuard off again" "inactive" systemctl is-active usbguard
expect "sheep: outgoing guard off again" "inactive" systemctl is-active opensnitch
after=$(deployments)
if [[ $before == "$after" ]]; then ok "levels left the boot entries and arguments alone"; else bad "levels changed boot entries: $(oneline "$before") -> $(oneline "$after")"; fi

# --- Network trust and Game Mode ---------------------------------------------------------------
# QEMU's network is wired: the dispatcher (lupi _classify) must have made it a home network
uuid="" dev=""
for _ in $(seq 30); do
    IFS=: read -r uuid dev < <(nmcli -t -f UUID,TYPE,DEVICE connection show --active | awk -F: '$2 == "802-3-ethernet" { print $1 ":" $3; exit }')
    [[ -n $uuid && -n $(nmcli -g connection.zone connection show "$uuid" 2>/dev/null) ]] && break
    sleep 2
done
if [[ -z $uuid ]]; then
    bad "network trust: the VM has no wired connection"
else
    expect "new wired network is trusted (home)" "lupios" nmcli -g connection.zone connection show "$uuid"

    check "Game Mode on (home network)" widget game on
    check "home: Game Mode opens Steam Remote Play" firewall-cmd --zone=lupios --query-service=steam-streaming
    expect "Game Mode pauses automatic updates" "" update_timers
    check "Game Mode off" widget game off
    refuse "Game Mode off closes the Steam ports" firewall-cmd --zone=lupios --query-service=steam-streaming
    expect "automatic updates resumed" "$updates" update_timers

    check "switch to public, as the widget does" widget net public
    expect "public: firewall zone" "lupios-public" firewall-cmd --get-zone-of-interface="$dev"
    # nmcli prints these settings as "no" or as their number, 0, depending on its version
    check "public: no mDNS or LLMNR" bash -c \
        "nmcli -g connection.mdns,connection.llmnr connection show '$uuid' | grep -Eqx '(no|0):(no|0)'"
    # The firewall policy lupios-public-quiet: this PC's own discovery announcements stay in
    refuse "public: mDNS announcements dropped on the way out" bash -c 'echo hi >/dev/udp/224.0.0.251/5353'
    check "public: other traffic still goes out" bash -c 'echo hi >/dev/udp/224.0.0.251/5354'
    check "Game Mode on (public network)" widget game on
    refuse "public: Game Mode keeps the Steam ports closed" firewall-cmd --zone=lupios-public --query-service=steam-streaming
    check "Game Mode off" widget game off

    check "back to home, as the widget does" widget net home
    expect "home: firewall zone" "lupios" firewall-cmd --get-zone-of-interface="$dev"
    check "home: device discovery goes out again" bash -c 'echo hi >/dev/udp/224.0.0.251/5353'
fi

# --- Strict lab --------------------------------------------------------------------------------
# Used the way a person would: as a normal user with a secret in their home folder. Lingering starts
# that user's systemd session, which rootless podman expects.
user=labtest
useradd --create-home "$user"
uid=$(id -u "$user") home=$(getent passwd "$user" | cut -d: -f6)
loginctl enable-linger "$user"
for _ in $(seq 30); do [[ -S /run/user/$uid/bus ]] && break; sleep 1; done
as_user() {
    runuser -u "$user" -- env HOME="$home" USER="$user" XDG_RUNTIME_DIR="/run/user/$uid" \
        DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$uid/bus" "$@"
}
as_user sh -c 'echo secret >~/canary'
# The first start downloads the Lab (a few GB) through podman's signature check: so this also shows
# the installed system accepts the signed Lab
if out=$(as_user timeout 1200 lupi lab strict true 2>&1); then
    ok "strict lab: created from the signed Lab image"
    # Commands do run in it, so the refusals below come from what it can't see
    check "strict lab: it's Kali inside" as_user lupi lab strict grep -qi kali /etc/os-release
    refuse "strict lab: your home folder isn't there" as_user lupi lab strict cat "$home/canary"
    refuse "strict lab: the disk isn't there (/run/host)" as_user lupi lab strict ls /run/host
    refuse "strict lab: your desktop session isn't there" as_user lupi lab strict test -e "/run/user/$uid/bus"
    label=$(as_user lupi lab strict cat /proc/1/attr/current 2>&1 | tr -d '\0')
    if [[ $label == *:container_t:* ]]; then ok "strict lab: SELinux confines it ($label)"; else bad "strict lab: not confined by SELinux: $label"; fi
    check "strict lab: writes to its shared folder" as_user lupi lab strict sh -c 'echo hi >/root/shared/from-lab'
    expect "strict lab: the file arrives in ~/LupiLab" "hi" cat "$home/LupiLab/lupi-lab-strict/from-lab"
    retry "strict lab: has internet" as_user lupi lab strict getent hosts fedoraproject.org
else
    bad "strict lab: couldn't create it: $(oneline "$(tail -n 5 <<<"$out")")"
fi

# --- Nothing failed ----------------------------------------------------------------------------
# Units that can only work on real hardware, so they fail in every VM:
# mcelog listens for the processor's hardware error reports, which a virtual CPU doesn't send.
vm_only="mcelog.service"
failed=$(systemctl --failed --no-legend --plain | awk '{print $1}' | grep -v lupios-ci | grep -vxF "$vm_only" | tr '\n' ' ')
if [[ -z $failed ]]; then ok "no failed units (ignoring, in a VM: $vm_only)"; else bad "failed units: $failed"; fi

lupi-security-check 2>&1 | sed 's/\x1b\[[0-9;]*m//g; s/^/LUPIOS-CI info  /'

if ((fails == 0)); then echo "LUPIOS-CI: PASS"; else echo "LUPIOS-CI: FAIL ($fails)"; fi
