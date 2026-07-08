#!/usr/bin/env bash
# Polls the B20 Activation Registry for the ASSET variant and fires the
# deploy script the moment it flips `true`.
#
# Usage:
#   source .env
#   ./scripts/wait-and-deploy.sh
#
# Requires: base-cast, base-forge (Base's Foundry build), jq
# See: https://docs.base.org/get-started/launch-b20-token

set -euo pipefail

: "${RPC_URL:?RPC_URL not set — source your .env first}"
: "${PRIVATE_KEY:?PRIVATE_KEY not set — source your .env first}"
: "${CHAIN_ID:?CHAIN_ID not set — source your .env first}"

REG=0x8453000000000000000000000000000000000001
VARIANT_HASH=$(base-cast keccak "base.b20_asset")

POLL_INTERVAL="${POLL_INTERVAL:-30}"   # seconds between checks
DEPLOY_SCRIPT="${DEPLOY_SCRIPT:-script/CreateToken.s.sol}"

echo "Watching Activation Registry ($REG) on $RPC_URL"
echo "Feature: base.b20_asset ($VARIANT_HASH)"
echo "Polling every ${POLL_INTERVAL}s..."
echo

attempt=0
while true; do
  attempt=$((attempt + 1))
  now="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"

  is_active=$(base-cast call "$REG" "isActivated(bytes32)(bool)" "$VARIANT_HASH" --rpc-url "$RPC_URL" || echo "error")

  if [[ "$is_active" == "true" ]]; then
    echo "[$now] ✅ ASSET feature is active (checked $attempt times). Deploying now..."
    break
  elif [[ "$is_active" == "error" ]]; then
    echo "[$now] ⚠️  RPC call failed, retrying in ${POLL_INTERVAL}s..."
  else
    echo "[$now] ⏳ Not yet active (attempt $attempt). Retrying in ${POLL_INTERVAL}s..."
  fi

  sleep "$POLL_INTERVAL"
done

echo
echo "Running deploy script: $DEPLOY_SCRIPT"
base-forge script "$DEPLOY_SCRIPT" \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast

echo
echo "Deploy complete. Capturing token address..."
TOKEN_ADDRESS=$(jq -er '.returns.token.value' \
  "broadcast/$(basename "$DEPLOY_SCRIPT")/$CHAIN_ID/run-latest.json")

echo "TOKEN_ADDRESS=$TOKEN_ADDRESS"

if ! grep -q '^export TOKEN_ADDRESS=' .env 2>/dev/null; then
  echo "export TOKEN_ADDRESS=$TOKEN_ADDRESS" >> .env
  echo "Appended TOKEN_ADDRESS to .env"
fi
