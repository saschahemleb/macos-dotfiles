# Repository instructions

Always apply changes made to the source files by executing `chezmoi apply` afterwards. To verify, run `chezmoi diff` or `chezmoi status` (empty output means everything is applied) instead of reading the target files under `~`.

In a git worktree (any checkout other than `~/.local/share/chezmoi`), plain `chezmoi` commands use the main checkout as the source and would apply the wrong files. Pass the worktree path instead: `chezmoi --source <worktree-path> apply`, and verify with `chezmoi --source <worktree-path> diff` or `status`. This applies to every `chezmoi apply` mentioned below.

For package changes, update `.chezmoidata/homebrew_packages.yaml`. Adding a package there is sufficient: the next `chezmoi apply` will install it. Do not run Homebrew install or uninstall commands unless the user explicitly asks to change the live system. Removing a package from the list stops managing it but does not uninstall an existing copy.

After changing `dot_config/rex/init.lua`, run `chezmoi apply` and then `rex config reload`, because Rex doesn't watch the file. Check the result with `rex config check` before reloading and `rex keymap` after. If `rex` isn't on `PATH`, use `"/Applications/Rex Beta.app/Contents/Helpers/Rex Server.rex/Contents/MacOS/rex"`.
