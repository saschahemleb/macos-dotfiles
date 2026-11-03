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

T3 Code runs Codex and, on work machines, Claude Code. Shared instructions live
in `.chezmoitemplates/agent-instructions` and render to `~/.codex/AGENTS.md`.
`~/.claude/CLAUDE.md` imports that file.

Codex and Claude Code write state into their own config files, such as trusted
projects and hook approvals. chezmoi only pins chosen keys in
`~/.codex/config.toml` and `~/.claude/settings.json` and leaves the rest alone,
using the same approach as the T3 Code settings below.

On work machines, both agents use the company LiteLLM gateway. They get a token
from `~/.local/bin/entra-cli-auth`, which the
[claude-code setup](https://git.eventim.net/ai-enablement/platform/developer-tools/claude-code)
installs. Telemetry stays off. Private machines use Codex with its defaults;
sign in with `codex login`.

## T3 Code

T3 Code rewrites its own settings files, so chezmoi only pins chosen values in
`~/.t3/userdata/settings.json` and `client-settings.json` and leaves every other
key alone. The pinned values live in the `modify_` templates under
`private_dot_t3/private_userdata/`; the LiteLLM models and defaults apply only on
work machines. A file that already matches is left untouched.

On work machines, the model picker shows only the chosen LiteLLM models. All
other models are hidden. Codex lists every model the gateway offers, so
`$litellmModels` in `modify_settings.json` must match the gateway's list. When
LiteLLM adds a model, add it there, or it shows up in the picker. To get the
current list:

```sh
curl -s https://litellm.stg.enablement.ai.eventim.cloud/v1/models \
  -H "Authorization: Bearer $(~/.local/bin/entra-cli-auth)" | jq -r '.data[].id'
```

A change made in the app stays local unless its key is pinned. To keep one, add
its path and value to the template's `$pinned` list (nested keys use dots, such
as `storageCleanup.worktreeOnMerge`). If T3 Code later changes a pinned value,
the next `chezmoi apply` sets it back. The shared logic is in
`.chezmoitemplates/pin-settings`.

## Zed extensions

Manage extension IDs in `.chezmoidata/zed_extensions.yaml`, then run `chezmoi apply`.
The list is rendered into Zed's `auto_install_extensions` setting. Zed installs
entries set to `true` and uninstalls entries set to `false` when it processes the
settings (launch Zed if it is closed). Removing an entry stops managing it;
use `false` to explicitly remove an extension.

See [Zed's extension settings](https://zed.dev/docs/reference/all-settings#auto-install-extensions).

