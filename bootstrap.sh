#!/usr/bin/env bash

set -Eeuo pipefail

red='\033[0;31m'
green='\033[0;32m'
nc='\033[0m'
checkmark='\xE2\x9C\x94'

fail() {
  local errmsg=$1
  local output="${2:-}"
  echo -e "${red}${errmsg}${nc}"
  if [[ -n "$output" ]]; then
    echo "Output:"
    echo $output
  fi
  exit 1
}

install_clt() {
  local installed=0
  local out=""
  if ! out=$(2>&1 xcode-select --install); then
    if [[ "$out" =~ "already installed" ]]; then
      clt_installed=1
    fi
  else
    clt_installed=1
  fi

  if [[ $clt_installed ]]; then
    return 0
  fi

  fail "Error installing Command Line Tools" "$out"
}

install_brew() {
  if ! 1>/dev/null 2>&1 which brew; then
    /usr/bin/env bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    if [[ -f /opt/homebrew/bin/brew ]]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -f /usr/local/bin/brew ]]; then
      eval "$(/usr/local/bin/brew shellenv)"
    fi
  else
    return 0
  fi

  local out=""
  if ! out=$(2>&1 brew update); then
    fail "Error fetching latest Homebrew formulae" "$out"
  fi

  return 0
}

install_chezmoi() {
  if 1>/dev/null 2>&1 which chezmoi; then
    return 0
  fi

  if ! out=$(2>&1 brew install chezmoi); then
    fail "Error installing chezmoi" "$out"
  fi

  return 0
}

init_chezmoi_repo() {
  if [[ -d "~/.local/share/chezmoi" ]]; then
    return 0
  fi

  chezmoi init https://github.com/saschahemleb/macos-dotfiles.git
}

install_clt
echo -e "Command Line Tools ${green}${checkmark}${nc}"

install_brew
echo -e "Homebrew ${green}${checkmark}${nc}"

install_chezmoi
init_chezmoi_repo
echo -e "Chezmoi ${green}${checkmark}${nc}"

echo
echo "All done!"
echo "To check what changes chezmoi will make to your home directory, run:"
echo "  chezmoi diff"
echo "If you are happy with the changes, run:"
echo "  chezmoi apply -v"
echo
echo "If you are not happy, either edit the file:"
echo "  chezmoi edit "'$FILE'
echo "or start a merge:"
echo "  chezmoi merge "'$FILE'