#!/usr/bin/env bash

set -Eeuo pipefail

skill_dir="${XDG_CONFIG_HOME:-$HOME/.config}/opencode/skills/herdr"
skill=$(herdr --skill)
mkdir -p "$skill_dir"
printf '%s\n' "$skill" > "$skill_dir/SKILL.md"
