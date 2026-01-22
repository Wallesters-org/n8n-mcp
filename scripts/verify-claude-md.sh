#!/bin/bash
# Quick CLAUDE.md Verification Script
# 
# This script performs basic sanity checks on CLAUDE.md documentation
# without requiring full npm installation or test suite execution.
#
# Conceived by Romuald Członkowski - www.aiadvisors.pl/en

set -e

echo "🔍 CLAUDE.md Verification Script"
echo "=================================="
echo ""

ERRORS=0

# Check if CLAUDE.md exists
if [ ! -f "CLAUDE.md" ]; then
    echo "❌ ERROR: CLAUDE.md not found"
    exit 1
fi

echo "✅ CLAUDE.md file exists"

# Check version in package.json
PKG_VERSION=$(grep '"version":' package.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
echo "📦 Package version: $PKG_VERSION"

if grep -q "\*\*Current Version:\*\* $PKG_VERSION" CLAUDE.md; then
    echo "✅ Version number matches in CLAUDE.md"
else
    echo "❌ ERROR: Version mismatch in CLAUDE.md"
    ERRORS=$((ERRORS + 1))
fi

# Check MCP tools count
if grep -q "\*\*Total MCP Tools:\*\* 20 tools with full annotations" CLAUDE.md; then
    echo "✅ MCP tools count documented (20 tools)"
else
    echo "⚠️  WARNING: MCP tools count not found or incorrect"
fi

# Verify critical directories exist
DIRS=("src/config" "src/loaders" "src/parsers" "src/database" "src/services" "src/mcp" "src/mcp/tool-docs")
echo ""
echo "📁 Checking critical directories..."
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir"
    else
        echo "  ❌ $dir (missing)"
        ERRORS=$((ERRORS + 1))
    fi
done

# Count actual MCP tools
echo ""
echo "🔧 Counting MCP tools..."
MAIN_TOOLS=$(grep -o "name: '[^']*'" src/mcp/tools.ts | wc -l | tr -d ' ')
MANAGER_TOOLS=$(grep "^\s*name: 'n8n_" src/mcp/tools-n8n-manager.ts | wc -l | tr -d ' ')
TOTAL_TOOLS=$((MAIN_TOOLS + MANAGER_TOOLS))

echo "  - Main tools (tools.ts): $MAIN_TOOLS"
echo "  - Manager tools (tools-n8n-manager.ts): $MANAGER_TOOLS"
echo "  - Total: $TOTAL_TOOLS"

if [ "$TOTAL_TOOLS" -eq 20 ]; then
    echo "✅ Tool count verified (20 tools)"
else
    echo "⚠️  WARNING: Expected 20 tools, found $TOTAL_TOOLS"
fi

# Check for critical files
echo ""
echo "📄 Checking critical files..."
FILES=("src/mcp/server.ts" "src/http-server.ts" "src/mcp-engine.ts" "tsconfig.json" "package.json")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check test structure
echo ""
echo "🧪 Checking test structure..."
if [ -d "tests/unit" ]; then
    UNIT_TESTS=$(find tests/unit -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    echo "  ✅ tests/unit/ ($UNIT_TESTS test files)"
else
    echo "  ❌ tests/unit/ (missing)"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "tests/integration" ]; then
    INTEGRATION_TESTS=$(find tests/integration -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    echo "  ✅ tests/integration/ ($INTEGRATION_TESTS test files)"
else
    echo "  ❌ tests/integration/ (missing)"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "tests/documentation" ]; then
    DOC_TESTS=$(find tests/documentation -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
    echo "  ✅ tests/documentation/ ($DOC_TESTS test files)"
else
    echo "  ⚠️  tests/documentation/ (missing - expected after this PR)"
fi

# Summary
echo ""
echo "=================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed!"
    echo ""
    echo "To run comprehensive verification tests:"
    echo "  npm test tests/documentation/claude-md-verification.test.ts"
    exit 0
else
    echo "❌ $ERRORS error(s) found"
    echo ""
    echo "Please review the errors above and update CLAUDE.md accordingly."
    exit 1
fi
