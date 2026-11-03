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

## Coding agents

[Herdr](https://herdr.dev/) runs Codex and, on work machines, Claude Code.
Shared instructions live in `.chezmoitemplates/agent-instructions` and render
to `~/.codex/AGENTS.md`. `~/.claude/CLAUDE.md` imports that file.

Codex and Claude Code write state into their own config files, such as trusted
projects and hook approvals. chezmoi only pins chosen keys in
`~/.codex/config.toml` and `~/.claude/settings.json` and leaves the rest alone.
The values to pin are listed in `$pinned` in each `modify_` template (nested
keys use dots, such as `features.apps`). If an app later changes a pinned value,
the next `chezmoi apply` sets it back. The shared logic is in
`.chezmoitemplates/pin-settings`.

On work machines, both agents use the company LiteLLM gateway. They get a token
from `~/.local/bin/entra-cli-auth`, which the
[claude-code setup](https://git.eventim.net/ai-enablement/platform/developer-tools/claude-code)
installs. Telemetry stays off. Private machines use Codex with its defaults;
sign in with `codex login`.

## Herdr

Hyper+A opens Herdr. chezmoi manages its key bindings in
`~/.config/herdr-app/keys.json` and `programs.json`. Herdr writes the rest of
that folder itself, so chezmoi only pins chosen keys in `settings.json`.
`programs.json` starts Codex with `--no-daemon`, because herdr-core (`hc`)
needs Codex's commands to run inside its terminal.

## Zed extensions

Manage extension IDs in `.chezmoidata/zed_extensions.yaml`, then run `chezmoi apply`.
The list is rendered into Zed's `auto_install_extensions` setting. Zed installs
entries set to `true` and uninstalls entries set to `false` when it processes the
settings (launch Zed if it is closed). Removing an entry stops managing it;
use `false` to explicitly remove an extension.

See [Zed's extension settings](https://zed.dev/docs/reference/all-settings#auto-install-extensions).

