#!/usr/bin/env bash
#
# Symlink gitignored files needed to run Firebase locally from the main clone
# into the current worktree. Run from any worktree:
#
#   ./scripts/link-local-files.sh            # link into the current worktree
#   ./scripts/link-local-files.sh --force    # also replace differing real files (backed up to .bak)
#   SOURCE_REPO=/path/to/clone ./scripts/link-local-files.sh   # override the source
#
# node_modules is intentionally excluded (install per-worktree).

set -euo pipefail

# Source clone that holds the real local files (override with SOURCE_REPO env).
SOURCE="${SOURCE_REPO:-/Users/aalmacin/Projects/inventory-tracker}"
SOURCE="${SOURCE%/}"

# Gitignored paths required to run Firebase locally. Globs are expanded in SOURCE.
ITEMS=(
  ".env.local"
  "emulator-data"
  "scripts/seed-edo-*"
)

FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

DEST="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "error: not inside a git repository" >&2; exit 1; }

if [[ ! -d "$SOURCE" ]]; then
  echo "error: source clone not found: $SOURCE" >&2
  echo "       set SOURCE_REPO=/path/to/clone" >&2
  exit 1
fi

if [[ "$SOURCE" == "$DEST" ]]; then
  echo "error: source and worktree are the same dir ($DEST); run from a worktree." >&2
  exit 1
fi

echo "Linking local files"
echo "  from: $SOURCE"
echo "  into: $DEST"
echo

link_one() {
  local rel="$1"
  local target="$SOURCE/$rel"
  local link="$DEST/$rel"

  # Already the correct symlink.
  if [[ -L "$link" && "$(readlink "$link")" == "$target" ]]; then
    echo "  ok     $rel"
    return
  fi

  if [[ -e "$link" && ! -L "$link" ]]; then
    # A real file/dir is in the way. Replace only if it's a file identical to
    # the source, otherwise leave it unless --force (then back it up).
    if [[ -f "$link" && -f "$target" ]] && cmp -s "$link" "$target"; then
      rm -f "$link"
    elif [[ "$FORCE" -eq 1 ]]; then
      local bak="$link.bak.$(date +%Y%m%d%H%M%S)"
      echo "  backup $rel -> $(basename "$bak")"
      mv "$link" "$bak"
    else
      echo "  WARN   $rel exists and differs from source — left untouched (use --force)"
      return
    fi
  fi

  mkdir -p "$(dirname "$link")"
  ln -sfn "$target" "$link"
  echo "  link   $rel"
}

for item in "${ITEMS[@]}"; do
  matched=0
  for target in "$SOURCE"/$item; do
    [[ -e "$target" ]] || continue
    matched=1
    link_one "${target#"$SOURCE"/}"
  done
  [[ "$matched" -eq 0 ]] && echo "  skip   $item (no match in source)"
done

echo
echo "Done."
