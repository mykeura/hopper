# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Miguel Euraque

"""Hopper model provider for Hermes Agent.

Hopper exposes a user-curated list of OpenRouter model IDs without modifying
Hermes' built-in OpenRouter catalog.
"""

from __future__ import annotations

import os
from pathlib import Path

from providers import register_provider

try:
    from plugins.model_providers.openrouter import OpenRouterProfile
except ImportError as exc:
    raise ImportError(
        "Hopper requires a Hermes version that includes the bundled OpenRouter "
        "model-provider plugin."
    ) from exc


DESCRIPTION = (
    "Hopper for @mykeura - Add and manage custom OpenRouter models in Hermes "
    "without modifying the core catalog."
)

DEFAULT_MODELS: tuple[str, ...] = (
    "inclusionai/ling-3.0-flash-vl:free",
    "inclusionai/ling-3.0-flash-fin:free",
    "inclusionai/ling-3.0-flash-sante:free",
)


def _hermes_home() -> Path:
    configured = os.environ.get("HERMES_HOME")
    return Path(configured).expanduser() if configured else Path.home() / ".hermes"


def _models_file() -> Path:
    configured = os.environ.get("HOPPER_MODELS_FILE")
    if configured:
        return Path(configured).expanduser()
    return _hermes_home() / "plugin-data" / "hopper" / "models.txt"


def _ensure_models_file() -> Path:
    path = _models_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        content = (
            "# Hopper OpenRouter models — one model ID per line.\n"
            "# Blank lines and lines beginning with # are ignored.\n"
            + "\n".join(DEFAULT_MODELS)
            + "\n"
        )
        path.write_text(content, encoding="utf-8")
    return path


def _read_models() -> list[str]:
    path = _ensure_models_file()
    models: list[str] = []
    seen: set[str] = set()

    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return list(DEFAULT_MODELS)

    for raw in lines:
        model = raw.strip()
        if not model or model.startswith("#"):
            continue
        if model not in seen:
            seen.add(model)
            models.append(model)

    # Empty is intentional: users are allowed to hide every Hopper model.
    return models


class HopperProfile(OpenRouterProfile):
    """OpenRouter profile whose picker list is controlled by Hopper."""

    def fetch_models(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: float = 8.0,
    ) -> list[str] | None:
        return _read_models()


hopper = HopperProfile(
    name="hopper",
    aliases=("hop",),
    env_vars=("OPENROUTER_API_KEY",),
    display_name="Hopper",
    description=DESCRIPTION,
    signup_url="https://openrouter.ai/keys",
    base_url="https://openrouter.ai/api/v1",
    models_url="https://openrouter.ai/api/v1/models",
    fallback_models=DEFAULT_MODELS,
)

register_provider(hopper)
