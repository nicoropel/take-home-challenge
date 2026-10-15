#!/usr/bin/env bash
set -euo pipefail

IMAGE="${IMAGE:-registry.example/atlas-api}"
TAG="${TAG:-${GITHUB_SHA:-local}}"

pnpm install --frozen-lockfile
pnpm test
docker build --tag "${IMAGE}:${TAG}" .
