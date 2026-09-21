# Hermes catalog entry

`hopper.yaml.template` is the proposed entry for the official Hermes Agent
catalog. Copy it to the Hermes repository as `plugin-catalog/hopper.yaml` only
after the Hopper catalog-ready commit has been created and pushed.

The catalog schema requires an exact 40-character commit SHA. Materialize the
template after the final Hopper commit with:

```bash
SHA="$(git -C /path/to/hopper rev-parse HEAD)"
sed "s/__COMMIT_SHA_40_HEX__/${SHA}/g" \
  /path/to/hopper/catalog-entry/hopper.yaml.template \
  > /path/to/hermes-agent/plugin-catalog/hopper.yaml
```

The resulting entry should be reviewed in the Hermes repository and validated
there. The image URL is pinned to the same SHA and points to the 2:1
`images/hopper-catalog.jpg` asset. The entry declares `requires_hermes:
">=0.21.3"`, the conservative minimum verified for the SDK surfaces used by
the catalog variant, and `platforms: [linux, macos]` because the helper uses
POSIX shell/file behavior and the supported Desktop targets are those two
platforms.

The entry uses the single `models` catalog category. The catalog variant lives
under `subdir: catalog`; it is independent of the repository's `install.sh`,
which remains a manual-installation fallback only.
