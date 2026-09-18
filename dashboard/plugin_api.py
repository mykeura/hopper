# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Miguel Euraque

"""Desktop/dashboard API for Hopper's model editor."""

from __future__ import annotations

import os
from pathlib import Path
import tempfile

from fastapi import APIRouter, HTTPException

router = APIRouter()

DEFAULT_MODELS = [
    "inclusionai/ling-3.0-flash-vl:free",
    "inclusionai/ling-3.0-flash-fin:free",
    "inclusionai/ling-3.0-flash-sante:free",
    "deepseek/deepseek-v4-flash-0731:free",
]


def _hermes_home() -> Path:
    configured = os.environ.get("HERMES_HOME")
    return Path(configured).expanduser() if configured else Path.home() / ".hermes"


def _models_file() -> Path:
    configured = os.environ.get("HOPPER_MODELS_FILE")
    if configured:
        return Path(configured).expanduser()
    return _hermes_home() / "plugin-data" / "hopper" / "models.txt"


def _validate(model: str) -> str:
    model = model.strip()
    if not model:
        raise ValueError("empty model ID")
    if any(ch.isspace() for ch in model):
        raise ValueError(f"model ID contains whitespace: {model!r}")
    if "/" not in model:
        raise ValueError(
            f"{model!r} does not look like an OpenRouter model ID "
            "(expected provider/model)"
        )
    return model


def _parse_text(text: str) -> list[str]:
    models: list[str] = []
    seen: set[str] = set()
    for line_no, raw in enumerate(text.splitlines(), start=1):
        value = raw.strip()
        if not value or value.startswith("#"):
            continue
        try:
            value = _validate(value)
        except ValueError as exc:
            raise ValueError(f"line {line_no}: {exc}") from exc
        if value not in seen:
            seen.add(value)
            models.append(value)
    return models


def _write(models: list[str]) -> None:
    path = _models_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    content = (
        "# Hopper OpenRouter models — one model ID per line.\n"
        "# Blank lines and lines beginning with # are ignored.\n"
        + "\n".join(models)
        + ("\n" if models else "")
    )
    fd, tmp_name = tempfile.mkstemp(prefix="models.", dir=str(path.parent), text=True)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(content)
        os.replace(tmp_name, path)
    finally:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)


def _read() -> list[str]:
    path = _models_file()
    if not path.exists():
        _write(DEFAULT_MODELS)
        return list(DEFAULT_MODELS)

    models: list[str] = []
    seen: set[str] = set()
    for raw in path.read_text(encoding="utf-8").splitlines():
        value = raw.strip()
        if not value or value.startswith("#"):
            continue
        try:
            value = _validate(value)
        except ValueError:
            continue
        if value not in seen:
            seen.add(value)
            models.append(value)
    return models


def _payload(models: list[str]) -> dict:
    return {
        "models": models,
        "text": "\n".join(models),
        "count": len(models),
        "path": str(_models_file()),
    }


@router.get("/models")
async def get_models():
    return _payload(_read())


@router.put("/models")
async def put_models(body: dict):
    text = body.get("text")
    models = body.get("models")

    try:
        if isinstance(text, str):
            parsed = _parse_text(text)
        elif isinstance(models, list):
            parsed = []
            seen: set[str] = set()
            for raw in models:
                if not isinstance(raw, str):
                    raise ValueError("every model ID must be a string")
                value = _validate(raw)
                if value not in seen:
                    seen.add(value)
                    parsed.append(value)
        else:
            raise ValueError("send either a 'text' string or a 'models' list")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    _write(parsed)
    return _payload(parsed)


@router.post("/reset")
async def reset_models():
    _write(DEFAULT_MODELS)
    return _payload(list(DEFAULT_MODELS))
