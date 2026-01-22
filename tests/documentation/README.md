# Documentation Verification Tests

This directory contains tests that verify the accuracy of documentation files against the actual codebase.

## Tests

### CLAUDE.md Verification (`claude-md-verification.test.ts`)

Comprehensive test suite that verifies CLAUDE.md documentation accuracy, including:

- **Version Information**: Verifies package version and dependency versions match
- **Architecture Structure**: Checks that all documented directories and files exist
- **MCP Tools Count**: Verifies the 20 MCP tools are correctly documented
- **Tool Documentation Structure**: Validates tool-docs directory organization
- **NPM Scripts**: Confirms all documented npm scripts exist
- **Test Structure**: Verifies test directory structure
- **Configuration Files**: Checks presence of all config files
- **Service Layer Files**: Validates service files exist as documented
- **Session Persistence**: Verifies session persistence feature documentation
- **Recent Features**: Checks recent feature documentation accuracy
- **MCP Annotations**: Validates MCP annotation documentation
- **Environment Variables**: Verifies environment variable documentation
- **Validation Profiles**: Checks validation profile documentation

## Running the Tests

```bash
# Run all documentation tests
npm test tests/documentation

# Run specific test file
npm test tests/documentation/claude-md-verification.test.ts

# Run with coverage
npm run test:coverage -- tests/documentation
```

## Adding New Documentation Tests

When adding new documentation files or sections that require verification:

1. Create a new test file in this directory: `<doc-name>-verification.test.ts`
2. Import necessary testing utilities from vitest
3. Structure tests by documentation section
4. Verify against actual codebase state
5. Update this README with test description

## Test Categories

Documentation verification tests should cover:

- ✅ Version numbers and dependencies
- ✅ File and directory structure
- ✅ Feature availability
- ✅ Command availability (npm scripts, CLI commands)
- ✅ Configuration options
- ✅ API surfaces

## Purpose

These tests serve multiple purposes:

1. **Prevent Documentation Drift**: Catch when documentation becomes outdated
2. **CI/CD Integration**: Automatically verify docs in pull requests
3. **Onboarding Quality**: Ensure new developers get accurate information
4. **Release Validation**: Confirm documentation updates with releases

## Maintenance

- Update tests when intentionally changing documented features
- Run tests after major refactoring
- Include in CI/CD pipeline
- Review failed tests before updating documentation

---

**Conceived by Romuald Członkowski** - [www.aiadvisors.pl/en](https://www.aiadvisors.pl/en)
