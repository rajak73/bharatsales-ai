#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export CI=true

echo "=== Cleaning Up Zombie Ports ==="
lsof -ti:6001,6002,6003 | xargs kill -9 2>/dev/null || true


echo "=== Clean Baseline ==="
echo "Install..."
pnpm install --frozen-lockfile --prod=false
echo "Install code: $?"

echo "Lint..."
pnpm run lint
echo "Lint code: $?"

echo "Type-check..."
pnpm run type-check
echo "Type-check code: $?"

echo "Build..."
pnpm run build
echo "Build code: $?"

echo "=== Jest 3x ==="
for i in 1 2 3; do
  echo "Jest run $i..."
  pnpm run test > "jest_run_$i.log" 2>&1
  echo "Jest run $i code: $?"
done

echo "=== Playwright 3x ==="
for i in 1 2 3; do
  echo "Seeding database for Playwright run $i..."
  pnpm --filter @bharatsales/api exec ts-node src/seed.ts
  echo "Playwright run $i..."
  pnpm exec playwright test > "playwright_run_$i.log" 2>&1
  echo "Playwright run $i code: $?"
done

echo "Baseline execution finished."
