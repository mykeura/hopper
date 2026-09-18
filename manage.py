#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Miguel Euraque

"""Manage the OpenRouter model list exposed by Hopper."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys
import tempfile


DEFAULT_MODELS = [
    "inclusionai/ling-3.0-flash-vl:free",
    "inclusionai/ling-3.0-flash-fin:free",
    "inclusionai/ling-3.0-flash-sante:free",
]


def hermes_home() -> Path:
    configured = os.environ.get("HERMES_HOME")
    return Path(configured).expanduser() if configured else Path.home() / ".hermes"


def models_file() -> Path:
    configured = os.environ.get("HOPPER_MODELS_FILE")
    if configured:
        return Path(configured).expanduser()
    return hermes_home() / "plugin-data" / "hopper" / "models.txt"


def validate_model_id(model: str) -> str:
    model = model.strip()
    if not model:
        raise ValueError("empty model ID")
    if model.startswith("#"):
        raise ValueError("comments are not model IDs")
    if any(ch.isspace() for ch in model):
        raise ValueError(f"model ID contains whitespace: {model!r}")
    if "/" not in model:
        raise ValueError(
            f"{model!r} does not look like an OpenRouter model ID "
            "(expected provider/model)"
        )
    return model


def read_models() -> list[str]:
    path = models_file()
    if not path.exists():
        return []
    out: list[str] = []
    seen: set[str] = set()
    for raw in path.read_text(encoding="utf-8").splitlines():
        item = raw.strip()
        if not item or item.startswith("#"):
            continue
        try:
            item = validate_model_id(item)
        except ValueError:
            continue
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


def write_models(models: list[str]) -> None:
    path = models_file()
    path.parent.mkdir(parents=True, exist_ok=True)

    unique: list[str] = []
    seen: set[str] = set()
    for raw in models:
        model = validate_model_id(raw)
        if model not in seen:
            seen.add(model)
            unique.append(model)

    content = (
        "# Hopper OpenRouter models — one model ID per line.\n"
        "# Blank lines and lines beginning with # are ignored.\n"
        + "\n".join(unique)
        + ("\n" if unique else "")
    )

    fd, tmp_name = tempfile.mkstemp(prefix="models.", dir=str(path.parent), text=True)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(content)
        os.replace(tmp_name, path)
    finally:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)


def cmd_list(_: argparse.Namespace) -> int:
    current = read_models()
    if not current:
        print("(no models configured)")
        return 0
    for model in current:
        print(model)
    return 0


def cmd_add(args: argparse.Namespace) -> int:
    current = read_models()
    added = 0
    for raw in args.models:
        model = validate_model_id(raw)
        if model not in current:
            current.append(model)
            added += 1
    write_models(current)
    print(f"Added {added} model(s).")
    print(f"Hopper catalog: {models_file()}")
    return 0


def cmd_remove(args: argparse.Namespace) -> int:
    current = read_models()
    targets = {validate_model_id(item) for item in args.models}
    new = [model for model in current if model not in targets]
    removed = len(current) - len(new)
    write_models(new)
    print(f"Removed {removed} model(s).")
    return 0


def cmd_reset(_: argparse.Namespace) -> int:
    write_models(DEFAULT_MODELS)
    print("Restored Hopper's three default Ling models.")
    print(f"Hopper catalog: {models_file()}")
    return 0


def cmd_file(_: argparse.Namespace) -> int:
    print(models_file())
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Manage the models exposed by Hopper in Hermes."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("list", help="List configured models")
    p.set_defaults(func=cmd_list)

    p = sub.add_parser("add", help="Add one or more OpenRouter model IDs")
    p.add_argument("models", nargs="+")
    p.set_defaults(func=cmd_add)

    p = sub.add_parser("remove", help="Remove one or more OpenRouter model IDs")
    p.add_argument("models", nargs="+")
    p.set_defaults(func=cmd_remove)

    p = sub.add_parser("reset", help="Restore Hopper's three bundled Ling models")
    p.set_defaults(func=cmd_reset)

    p = sub.add_parser("file", help="Print the Hopper models.txt path")
    p.set_defaults(func=cmd_file)

    args = parser.parse_args()
    try:
        return args.func(args)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
