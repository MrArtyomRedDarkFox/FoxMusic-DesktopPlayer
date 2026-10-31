#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required. Install the current LTS version from https://nodejs.org/"
  exit 1
fi
if [ ! -x "node_modules/.bin/electron" ]; then
  echo "Installing FoxsMusic Desktop dependencies for the first run..."
  npm install
fi
npm start
