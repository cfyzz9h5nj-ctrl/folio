#!/bin/sh
export PATH="/Users/juanbarroso/.local/bin:$PATH"
cd /Users/juanbarroso/folio
exec node /Users/juanbarroso/.local/npm-install/package/bin/npm-cli.js run dev
