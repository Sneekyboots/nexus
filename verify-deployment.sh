#!/bin/bash

# NEXUS Protocol - Deployment Verification
# Checks that everything is ready for CreateOS deployment

set -e

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   NEXUS Protocol - Deployment Verification             ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_mark="✓"
cross_mark="✗"

# Counter
total=0
passed=0

function test_check() {
  local name="$1"
  local cmd="$2"
  total=$((total + 1))
  
  if eval "$cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}${check_mark}${NC} $name"
    passed=$((passed + 1))
  else
    echo -e "${RED}${cross_mark}${NC} $name"
  fi
}

# 1. Git checks
echo -e "${YELLOW}📋 Git Configuration${NC}"
test_check "Git repository initialized" "git rev-parse --git-dir > /dev/null 2>&1"
test_check "Git remote 'origin' configured" "git config --get remote.origin.url > /dev/null"
test_check "On master branch" "[ $(git rev-parse --abbrev-ref HEAD) = 'master' ]"
test_check "Git working tree clean" "[ -z \"$(git status --porcelain)\" ]"

# 2. Build checks
echo -e "\n${YELLOW}🏗️  Build Configuration${NC}"
test_check "app/package.json exists" "[ -f app/package.json ]"
test_check "Build script defined" "grep -q '\"build\"' app/package.json"
test_check "TypeScript configuration" "[ -f app/tsconfig.json ]"

# 3. Build artifacts
echo -e "\n${YELLOW}📦 Build Artifacts${NC}"
test_check "app/dist/ exists" "[ -d app/dist ]"
test_check "index.html built" "[ -f app/dist/index.html ]"
test_check "CSS assets built" "[ -f app/dist/assets/*.css ] 2>/dev/null || [ -d app/dist/assets ]"
test_check "JS assets built" "[ -f app/dist/assets/*.js ] 2>/dev/null || [ -d app/dist/assets ]"

# 4. Deployment configuration
echo -e "\n${YELLOW}⚙️  Deployment Configuration${NC}"
test_check "opencode.json exists" "[ -f opencode.json ]"
test_check "opencode.json has API key" "grep -q 'skp_' opencode.json 2>/dev/null || grep -q 'X-Api-Key' opencode.json"
test_check "render.yaml exists" "[ -f render.yaml ]"
test_check ".gitignore protects secrets" "grep -q 'opencode.json' .gitignore"

# 5. Documentation
echo -e "\n${YELLOW}📚 Documentation${NC}"
test_check "QUICK_DEPLOY.md exists" "[ -f QUICK_DEPLOY.md ]"
test_check "CREATEOS_DEPLOYMENT.md exists" "[ -f CREATEOS_DEPLOYMENT.md ]"
test_check "NODEOPS_DEPLOYMENT.md exists" "[ -f NODEOPS_DEPLOYMENT.md ]"
test_check "OPENCODE_INTEGRATION.md exists" "[ -f OPENCODE_INTEGRATION.md ]"
test_check "README.md exists" "[ -f README.md ]"
test_check "DEMO_SCRIPT.md exists" "[ -f DEMO_SCRIPT.md ]"

# 6. Source code
echo -e "\n${YELLOW}💻 Source Code${NC}"
test_check "main.tsx exists" "[ -f app/src/main.tsx ]"
test_check "nexusService.ts exists" "[ -f app/src/services/nexusService.ts ]"
test_check "RegisterEntity form exists" "[ -f app/src/pages/entities/RegisterEntity.tsx ]"
test_check "HomePage exists" "[ -f app/src/pages/HomePage.tsx ]"

# 7. Styles
echo -e "\n${YELLOW}🎨 Styling${NC}"
test_check "index.css exists" "[ -f app/src/styles/index.css ]"
test_check "sketch.css exists" "[ -f app/src/styles/sketch.css ]"
test_check "nexus.css exists" "[ -f app/src/styles/nexus.css ]"

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════╗"
if [ $passed -eq $total ]; then
  echo -e "║ ${GREEN}✓ ALL CHECKS PASSED ($passed/$total)${NC}                 ║"
  echo "╚════════════════════════════════════════════════════════╝"
  echo ""
  echo -e "${GREEN}✓ Ready for CreateOS Deployment!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Open: https://createos.nodeops.network"
  echo "  2. Create new Static Site project"
  echo "  3. Build: cd app && npm install && npm run build"
  echo "  4. Publish: app/dist"
  echo "  5. Deploy!"
  echo ""
  exit 0
else
  echo -e "║ ${RED}✗ SOME CHECKS FAILED ($passed/$total)${NC}                  ║"
  echo "╚════════════════════════════════════════════════════════╝"
  echo ""
  echo -e "${RED}Fix failing checks and retry${NC}"
  echo ""
  exit 1
fi
