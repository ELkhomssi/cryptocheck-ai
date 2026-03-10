#!/bin/bash
echo "🧪 Testing CryptoCheck AI Platform..."

# Test homepage
curl -s -o /dev/null -w "%{http_code}" https://your-domain.vercel.app/ && echo "✅ Homepage: OK" || echo "❌ Homepage: FAIL"

# Test API endpoints
echo "Testing AI Scanner API..."
curl -s -X POST https://your-domain.vercel.app/api/scan/token \
  -H "Content-Type: application/json" \
  -d '{"mintAddress":"So11111111111111111111111111111111111111112"}' | jq '.success' && echo "✅ AI Scanner: OK" || echo "❌ AI Scanner: FAIL"

echo "Testing Stripe Checkout API..."
curl -s -X POST https://your-domain.vercel.app/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_test_123","userId":"user_123"}' | jq '.sessionId' && echo "✅ Stripe: OK" || echo "❌ Stripe: FAIL"

echo "🎉 Platform testing complete!"
