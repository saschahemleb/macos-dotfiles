# Repository instructions

Make changes in the chezmoi source files only. Do not run `chezmoi apply` unless the user explicitly asks; the user will apply changes themselves.

For package changes, update `.chezmoidata/homebrew_packages.yaml`. Adding a package there is sufficient: the next `chezmoi apply` will install it. Do not run Homebrew install or uninstall commands unless the user explicitly asks to change the live system. Removing a package from the list stops managing it but does not uninstall an existing copy.
