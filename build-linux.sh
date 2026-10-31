#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if ! command -v npm >/dev/null 2>&1; then
  echo "Install Node.js and npm first: https://nodejs.org/"
  exit 1
fi
npm install
npm run dist:linux
echo "Finished. Linux packages are in the release folder."
