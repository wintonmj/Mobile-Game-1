#!/bin/bash

# Colors for better visual feedback
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to run all correctness checks
run_checks() {
  echo -e "${YELLOW}🔍 Running lint checks...${NC}"
  # Use the new lint:tests script that ignores @ts-nocheck in test files
  npm run lint:tests
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Linting failed. Fix the issues before continuing.${NC}"
    return 1
  fi

  echo -e "${YELLOW}✨ Running format check...${NC}"
  npm run format

  echo -e "${YELLOW}🧪 Running tests...${NC}"
  npm run test
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tests failed. Fix the test failures before continuing.${NC}"
    return 1
  fi

  echo -e "${YELLOW}🏗️ Running TypeScript check...${NC}"
  npx tsc --noEmit
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScript check failed. Fix the TypeScript errors before continuing.${NC}"
    return 1
  fi

  echo -e "${YELLOW}📦 Building the project...${NC}"
  npm run build
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Fix the build errors before continuing.${NC}"
    return 1
  fi

  # Check for any dead code
  echo -e "${YELLOW}🧟 Checking for dead code...${NC}"
  grep -r "TODO: Remove" src/ || true
  grep -r "FIXME:" src/ || true
  grep -r "@deprecated" src/ || true

  echo -e "${GREEN}✅ All checks passed successfully!${NC}"
  return 0
}

# Command to just run checks once
if [ "$1" == "check" ]; then
  run_checks
  exit $?
fi

# Command to watch for changes and run checks
if [ "$1" == "watch" ] || [ -z "$1" ]; then
  echo -e "${GREEN}👀 Watching for changes and running checks...${NC}"
  echo -e "${YELLOW}Press Ctrl+C to stop watching${NC}"
  
  # Initial run
  run_checks
  
  # Watch for changes in src directory using fswatch if available
  if command -v fswatch >/dev/null 2>&1; then
    fswatch -o ./src | while read f; do
      echo -e "\n${GREEN}🔄 Changes detected! Running checks...${NC}"
      run_checks
    done
  # If fswatch is not available, use nodemon as an alternative
  elif command -v npx >/dev/null 2>&1; then
    npx nodemon --watch src --ext ts,tsx,js,jsx,json,html,css --exec "bash run.sh check"
  else
    echo -e "${RED}Error: Neither fswatch nor nodemon are available.${NC}"
    echo -e "${YELLOW}Please install one of them:${NC}"
    echo "  - fswatch: brew install fswatch (macOS) or apt-get install fswatch (Linux)"
    echo "  - nodemon: npm install -g nodemon"
    exit 1
  fi
else
  echo -e "${YELLOW}Usage:${NC}"
  echo "  ./run.sh        - Watch for changes and run checks"
  echo "  ./run.sh watch  - Watch for changes and run checks"
  echo "  ./run.sh check  - Run checks once"
fi 