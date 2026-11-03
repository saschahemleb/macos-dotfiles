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

[T3 Code](https://t3.codes/) runs Codex and, on work machines, Claude Code.
Hyper+A opens it.

On work machines, both agents use the company LiteLLM gateway. They get a token
from `~/.local/bin/entra-cli-auth`, which the
[claude-code setup](https://git.eventim.net/ai-enablement/platform/developer-tools/claude-code)
installs. Private machines use Codex with its defaults; sign in with
`codex login`. T3 Code's Claude provider is disabled there.

chezmoi deploys `~/.claude/settings.json` as a whole file, on work machines only.
A setting you change in Claude Code stays only until the next `chezmoi apply`; to
keep it, add it to `dot_claude/settings.json`.

Codex and T3 Code write their own state into their settings files, such as
trusted projects. For `~/.codex/config.toml` and the files in `~/.t3/userdata/`,
chezmoi only pins chosen keys and leaves the rest alone. The values to pin are
listed in `$pinned` in each `modify_` template (nested keys use dots). If an app
later changes a pinned value, the next `chezmoi apply` sets it back. The shared
logic is in `.chezmoitemplates/pin-settings`.

## LiteLLM models

Codex and T3 Code don't list the models of a LiteLLM gateway themselves.

- **Codex** reads its model list from `~/.codex/litellm_models.json`
  (`model_catalog_json`). Add a model there by copying an entry and changing
  `slug`, `display_name` and `description`. List the available names with
  `curl -H "Authorization: Bearer $(~/.local/bin/entra-cli-auth)" <base_url>/models`.
  `<base_url>/models/<name>` returns its context and output limits.
- **Claude Code** gets its picker from `modelPicker` in
  `dot_claude/settings.json`.
- **T3 Code's Claude provider** only knows Anthropic's built-in model IDs, so the
  LiteLLM names are pinned as `customModels` in
  `private_dot_t3/private_userdata/modify_settings.json`.
