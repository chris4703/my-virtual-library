#!/usr/bin/env bash
set -euo pipefail

# Use only the URL of this codespace's forwarded port, rather than "all",
# because Vite also provides local-only proxy and configuration endpoints.
if [[ -n "${CODESPACE_NAME:-}" && -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]]; then
  host="${CODESPACE_NAME}-1420.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
  export HALCYON_ALLOWED_HOSTS="${host}"
  printf 'Allowed preview hostname: %s\n' "$host"
else
  echo "Not in Codespaces; Vite will use its default localhost/host-name allowlist."
fi

exec npm run dev -- --host 0.0.0.0
