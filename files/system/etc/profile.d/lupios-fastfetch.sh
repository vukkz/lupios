# shellcheck shell=sh
# LupiOS: show fastfetch (the wolf and system info) at the top of every new terminal window.
# Turn it off with `lupi fastfetch off`.
# Skipped in: nested shells of the same window, VS Code's terminal, and the plain text console.
if [ -n "${BASH_VERSION:-}" ] && [ -z "${LUPIOS_FASTFETCH_SHOWN:-}" ] &&
    [ "${TERM:-dumb}" != dumb ] && [ "${TERM:-}" != linux ] && [ "${TERM_PROGRAM:-}" != vscode ] &&
    command -v fastfetch >/dev/null 2>&1 &&
    [ ! -e "${XDG_CONFIG_HOME:-$HOME/.config}/lupios/fastfetch-off" ]; then
    case $- in
    *i*)
        export LUPIOS_FASTFETCH_SHOWN=1
        fastfetch
        ;;
    esac
fi
