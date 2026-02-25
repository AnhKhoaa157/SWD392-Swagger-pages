#!/bin/sh
# =====================================================
# Docker Health Check Script
# Tests if the backend server is responding
# =====================================================

set -e

# Health check endpoint
HEALTH_URL="${HEALTH_URL:-http://localhost:3000}"

# Maximum retries
MAX_RETRIES="${MAX_RETRIES:-3}"
RETRY_INTERVAL="${RETRY_INTERVAL:-2}"

echo "🏥 Checking backend health at $HEALTH_URL..."

for i in $(seq 1 $MAX_RETRIES); do
    if wget --quiet --tries=1 --spider --timeout=5 "$HEALTH_URL" 2>/dev/null; then
        echo "✅ Health check passed (attempt $i/$MAX_RETRIES)"
        exit 0
    fi
    
    if [ $i -lt $MAX_RETRIES ]; then
        echo "⏳ Health check failed, retrying in ${RETRY_INTERVAL}s... (attempt $i/$MAX_RETRIES)"
        sleep $RETRY_INTERVAL
    fi
done

echo "❌ Health check failed after $MAX_RETRIES attempts"
exit 1
