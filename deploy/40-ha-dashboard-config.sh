#!/bin/sh
# Writes the runtime config the app fetches on load, so one image works for any HA URL.
set -eu

: "${HA_URL:?HA_URL is required, e.g. https://homeassistant.alpine-ling.ts.net}"
HA_URL="${HA_URL%/}"

printf '{"haUrl":"%s"}\n' "$HA_URL" > /usr/share/nginx/html/config.json
echo "ha-dashboard: config.json haUrl=$HA_URL"
