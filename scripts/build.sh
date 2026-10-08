#!/usr/bin/env bash
set -euo pipefail

pnpm install --frozen-lockfile
pnpm test
docker build --tag registry.example/atlas-api:production .
