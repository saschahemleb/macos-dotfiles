#!/usr/bin/env bash

set -Eeuo pipefail

green='\033[0;32m'
nc='\033[0m'
checkmark='\xE2\x9C\x94'

repo="https://github.com/saschahemleb/macos-dotfiles.git"

install_packages() {
  sudo pacman -S --needed --noconfirm git chezmoi curl
}

install_mise() {
  if ! command -v mise >/dev/null 2>&1; then
    /usr/bin/env bash -c "$(curl -fsSL https://mise.run)"
  fi
}

init_and_apply() {
  chezmoi init --apply ${DOTFILES_BRANCH:+--branch "$DOTFILES_BRANCH"} "$repo"
}

# The apply runs `mise use`, and mise.run installs to ~/.local/bin.
export PATH="$HOME/.local/bin:$PATH"

install_packages
echo -e "git and chezmoi ${green}${checkmark}${nc}"

install_mise
echo -e "Mise ${green}${checkmark}${nc}"

init_and_apply
echo -e "Chezmoi ${green}${checkmark}${nc}"

echo
echo "All done!"
