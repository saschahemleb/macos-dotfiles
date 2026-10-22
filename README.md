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

## Codex usage in OpenCode

On private workstations, the local plugin in `dot_config/opencode/codex-usage/`
shows remaining subscription quota and reset countdowns in OpenCode's sidebar.
It reads the local Codex CLI's
account, which may differ from the account connected to OpenCode.

Install the Codex CLI and sign in with `codex login`. Check the login with
`codex login status`. The `codex` command must be on OpenCode's `PATH`.

Usage refreshes every 90 seconds. Run `/codex-usage` or choose **Refresh Codex CLI
usage** in the command palette to refresh sooner. Failed checks keep the last
successful values and mark them stale. The plugin only reads limits through
`codex app-server`; it does not start conversations or read credentials directly.

Run its tests with `npm test --prefix dot_config/opencode/codex-usage`.
