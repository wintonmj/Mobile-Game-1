#!/bin/bash

echo "🔍 Running lint checks..."
npm run lint

if [ $? -ne 0 ]; then
  echo "❌ Linting failed. Fix the issues before continuing."
  exit 1
fi

echo "✨ Running format check..."
npm run format

echo "🧪 Running tests..."
npm run test

if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Fix the test failures before continuing."
  exit 1
fi

echo "🏗️ Running TypeScript check..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
  echo "❌ TypeScript check failed. Fix the TypeScript errors before continuing."
  exit 1
fi

echo "📦 Building the project..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Fix the build errors before continuing."
  exit 1
fi

# Check for any dead code (this is a simple grep example - you might want a more sophisticated tool)
echo "🧟 Checking for dead code..."
grep -r "TODO: Remove" src/ || true
grep -r "FIXME:" src/ || true

echo "✅ All checks passed successfully!" 