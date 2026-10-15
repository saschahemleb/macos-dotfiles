---
name: Zoxide
description: "Resolve directory shortcuts using zoxide when the user mentions @z or asks to find a frequently used directory."
---

# Zoxide

Resolve directory shortcuts such as `@z household` before using a project path.

1. Run `zoxide query -- <search terms>` with the shell tool. Pass each search
   term as a safely quoted argument; never execute the user's text as shell code.
   For example, `@z household` means `zoxide query -- 'household'`.
2. Use the returned absolute path for subsequent operations, quoting it safely
   in shell commands or passing it as the tool's working directory.
3. If zoxide is unavailable or no match exists, ask the user for the directory.
   Do not install anything or guess a replacement path.
4. Verify that the returned path is an existing directory. If the result looks
   unrelated to the request, confirm with the user before proceeding.

Use the `zoxide` executable directly, not interactive `z` or `cd` shell
functions. Do not use interactive selection or modify the zoxide database.

This skill only resolves paths. Follow the user's request and the available
workspace or terminal tooling for subsequent actions; resolving a path does not
itself authorize creating workspaces or starting processes.
