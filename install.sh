#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Miguel Euraque

set -euo pipefail

SOURCE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
PROVIDER_DEST="$HERMES_HOME/plugins/model-providers/hopper"
DESKTOP_DEST="$HERMES_HOME/desktop-plugins/hopper"
DATA_DIR="$HERMES_HOME/plugin-data/hopper"
MODELS_FILE="$DATA_DIR/models.txt"
BACKUP_ROOT="$HERMES_HOME/plugin-backups"

OLD_UNIFIED="$HERMES_HOME/plugins/hopper"
OLD_CUSTOM_PROVIDER="$HERMES_HOME/plugins/model-providers/openrouter-custom"
OLD_CUSTOM_DATA="$HERMES_HOME/plugin-data/openrouter-custom/models.txt"
DEEPSEEK_ID="deepseek/deepseek-v4-flash-0731:free"

mkdir -p "$PROVIDER_DEST" "$DESKTOP_DEST" "$DATA_DIR" "$BACKUP_ROOT"

# Migrate a previous custom-model list when Hopper has no data file yet.
if [[ ! -f "$MODELS_FILE" ]]; then
  if [[ -f "$OLD_CUSTOM_DATA" ]]; then
    cp "$OLD_CUSTOM_DATA" "$MODELS_FILE"
  else
    cat > "$MODELS_FILE" <<'EOF'
# Hopper OpenRouter models — one model ID per line.
# Blank lines and lines beginning with # are ignored.
inclusionai/ling-3.0-flash-vl:free
inclusionai/ling-3.0-flash-fin:free
inclusionai/ling-3.0-flash-sante:free
EOF
  fi
fi

# v1.0.0 added DeepSeek by default. Remove that exact entry during upgrade,
# while preserving any other models the user added manually.
TMP_MODELS="$(mktemp)"
grep -Fvx "$DEEPSEEK_ID" "$MODELS_FILE" > "$TMP_MODELS" || true
mv "$TMP_MODELS" "$MODELS_FILE"

# If the user ended up with an empty file after removing DeepSeek, restore the
# three Ling defaults instead of leaving a surprising blank catalog.
if ! grep -Ev '^\s*(#|$)' "$MODELS_FILE" >/dev/null 2>&1; then
  cat > "$MODELS_FILE" <<'EOF'
# Hopper OpenRouter models — one model ID per line.
# Blank lines and lines beginning with # are ignored.
inclusionai/ling-3.0-flash-vl:free
inclusionai/ling-3.0-flash-fin:free
inclusionai/ling-3.0-flash-sante:free
EOF
fi

# Remove the previous unified package. Keeping it would make Capabilities think
# Hopper has an Agent half and render an Agent enable switch + version.
if [[ -d "$OLD_UNIFIED" ]]; then
  STAMP="$(date +%Y%m%d-%H%M%S)"
  mv "$OLD_UNIFIED" "$BACKUP_ROOT/hopper-unified-$STAMP"
  echo "Backed up the previous unified Hopper package to:"
  echo "  $BACKUP_ROOT/hopper-unified-$STAMP"
fi

# Also retire the original OpenRouter Custom prototype if it still exists.
if [[ -d "$OLD_CUSTOM_PROVIDER" ]]; then
  STAMP="$(date +%Y%m%d-%H%M%S)"
  mv "$OLD_CUSTOM_PROVIDER" "$BACKUP_ROOT/openrouter-custom-$STAMP"
  echo "Backed up OpenRouter Custom to:"
  echo "  $BACKUP_ROOT/openrouter-custom-$STAMP"
fi

cp "$SOURCE_DIR/model-provider/__init__.py" "$PROVIDER_DEST/__init__.py"
cp "$SOURCE_DIR/model-provider/plugin.yaml" "$PROVIDER_DEST/plugin.yaml"
cp "$SOURCE_DIR/manage.py" "$PROVIDER_DEST/manage.py"
chmod +x "$PROVIDER_DEST/manage.py"

cp "$SOURCE_DIR/desktop/plugin.js" "$DESKTOP_DEST/plugin.js"

# A prior unified desktop copy may carry a package marker. Remove it so Hermes
# treats Hopper as a standalone Desktop plugin and shows a dash for Agent.
rm -f "$DESKTOP_DEST/.hermes-package.json"

# Some older builds used a marker without the leading dot.
rm -f "$DESKTOP_DEST/hermes-package.json"

echo
echo "Hopper v1.2.0 installed."
echo
echo "Model provider:"
echo "  $PROVIDER_DEST"
echo "Desktop plugin:"
echo "  $DESKTOP_DEST"
echo "Model list:"
echo "  $MODELS_FILE"
echo
echo "Next:"
echo "  1. Restart Hermes / its gateway."
echo "  2. Open Capabilities -> Plugins and Rescan."
echo "  3. Select Hopper. Desktop should have a switch; Agent in Hermes should show —."
echo "  4. Select Settings in Hopper to open the OpenRouter models modal."
