#!/bin/bash
cd "$(dirname "$0")"
exec node_modules/.bin/rnc-cli start --reset-cache
