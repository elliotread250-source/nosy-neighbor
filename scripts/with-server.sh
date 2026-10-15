#!/usr/bin/env bash
# Run a command with a Vite dev server up on :5173 for its duration.
# Usage: scripts/with-server.sh node scripts/screenshots.mjs ...
cd "$(dirname "$0")/.."
if ! curl -s -o /dev/null localhost:5173; then
  npx vite --port 5173 --strictPort > /tmp/nn-vite.log 2>&1 &
  VPID=$!
  for i in $(seq 1 40); do curl -s -o /dev/null localhost:5173 && break; sleep 0.5; done
fi
"$@"
STATUS=$?
if [ -n "$VPID" ]; then kill $VPID 2>/dev/null; wait $VPID 2>/dev/null; fi
exit $STATUS
