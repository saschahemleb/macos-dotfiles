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

## Rex

The terminal is [Rex](https://www.superlogical.com/rex/docs/), which is in beta
and not available through Homebrew. Install it by hand: the download link is in
the Rex Beta Discord.

`~/.config/rex/init.lua` holds the key bindings and the actions that Hammerspoon's
Hyper+Return and Hyper+K hotkeys use. These need the app installed at
`/Applications/Rex Beta.app` and Remote Control turned on, which
`run_once_after_macos-defaults.php` does. Run `rex config reload` after changing
`init.lua`; Rex doesn't watch the file.

## T3 Code

T3 Code rewrites its own settings files, so chezmoi only pins chosen values in
`~/.t3/userdata/settings.json` and `client-settings.json` and leaves every other
key alone. The pinned values live in the `modify_` templates under
`private_dot_t3/private_userdata/`; the LiteLLM model defaults apply only on work
machines. A file that already matches is left untouched.

A change made in the app stays local unless its key is pinned. To keep one, add
its path and value to the template's `$pinned` list (nested keys use dots, such
as `storageCleanup.worktreeOnMerge`). If T3 Code later changes a pinned value,
the next `chezmoi apply` sets it back.

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
