#!/usr/bin/env bash
# Keep things working on systems set up by an older Wolf OS.
set -euo pipefail

# The security levels balanced and paranoid were renamed to wolf and sheep. Links in /etc
# made by `wolf level` on older versions still point at the old folder names.
ln -sfn wolf /usr/share/wolf-os/levels/balanced
ln -sfn sheep /usr/share/wolf-os/levels/paranoid
# The gaming level became part of Game Mode; systems left on it get the wolf level's settings
ln -sfn wolf /usr/share/wolf-os/levels/gaming
