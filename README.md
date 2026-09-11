# macos-dotfiles

## Installation

On a fresh macOS installation, you can use the bootstrap script to set everything up.
This will install the package manager Homebrew and setup chezmoi.

```shell
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/saschahemleb/macos-dotfiles/HEAD/bootstrap.sh)"
```

If you already have Homebrew installed, you can instead install and init chezmoi manually:

```shell
brew install chezmoi
chezmoi init https://github.com/saschahemleb/macos-dotfiles.git
```

## Zed extensions

Manage extension IDs in `.chezmoidata/zed_extensions.yaml`, then run `chezmoi apply`.
The list is rendered into Zed's `auto_install_extensions` setting. Zed installs
entries set to `true` and uninstalls entries set to `false` when it processes the
settings (launch Zed if it is closed). Removing an entry stops managing it;
use `false` to explicitly remove an extension.

See [Zed's extension settings](https://zed.dev/docs/reference/all-settings#auto-install-extensions).
