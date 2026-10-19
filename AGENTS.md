# Repository instructions

Always apply changes made to the source files by executing `chezmoi apply` afterwards. To verify, run `chezmoi diff` or `chezmoi status` (empty output means everything is applied) instead of reading the target files under `~`.

For package changes, update `.chezmoidata/homebrew_packages.yaml`. Adding a package there is sufficient: the next `chezmoi apply` will install it. Do not run Homebrew install or uninstall commands unless the user explicitly asks to change the live system. Removing a package from the list stops managing it but does not uninstall an existing copy.
