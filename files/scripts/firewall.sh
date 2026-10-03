#!/usr/bin/env bash
# Make the "lupios" zone (files/system/usr/lib/firewalld/zones/lupios.xml) the default.
# Stock Fedora desktops default to a zone that allows incoming ports 1025-65535.
set -euo pipefail

firewall-offline-cmd --set-default-zone=lupios
firewall-offline-cmd --get-default-zone

# Fail the build, not the user's PC, if one of our zone or policy files is invalid
firewall-offline-cmd --check-config
firewall-offline-cmd --info-policy=lupios-public-quiet
