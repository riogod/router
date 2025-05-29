# Contributing to @riogz/router

Thank you for your interest in the project! We welcome any contributions to the development of the router.

## 🚀 Quick Start for Contributors

### Rule for Contributors: **Choose the correct target branch**

As a contributor, you need to understand where to direct your changes:

### 🎯 Where to create a PR:

#### ✅ **To `master`** (for most cases):
- Bug fixes
- New features for the next release
- Documentation improvements
- Refactoring
- Dependency updates

#### 🎯 **To `release/vX.Y.Z`** (for urgent fixes):
- Critical bugs in the current release
- Hotfixes for production
- Only after agreement with maintainers

### 📋 Development Process:

```bash
# 1. Fork the repository
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/router.git
cd router

# 3. Determine the target branch and create a feature branch
# For regular changes:
git checkout master
git pull upstream master
git checkout -b feature/your-feature-name

# For hotfixes (only after agreement):
git checkout release/vX.Y.Z
git pull upstream release/vX.Y.Z
git checkout -b hotfix/critical-bug-fix

# 4. Make changes and test
npm install
npm test
npm run lint
npm run build

# 5. Commit your changes
git add .
git commit -m "feat: add your awesome feature"

# 6. Push to your fork
git push origin feature/your-feature-name

# 7. Create a PR to the correct target branch
```

## 📝 Types of Changes and Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) to describe your changes:

### 🐛 Bug Fixes
```bash
git commit -m "fix: resolve navigation issue in nested routes"
```

### ✨ New Features
```bash
git commit -m "feat: add support for query parameters validation"
```

### 💥 Breaking Changes
```bash
git commit -m "feat!: change router API to support async routes"
# or
git commit -m "feat: change router API

BREAKING CHANGE: Router.navigate now returns a Promise"
```

### 📚 Documentation
```bash
git commit -m "docs: update README with new examples"
```

### 🧪 Tests
```bash
git commit -m "test: add tests for route matching"
```

### 🔧 Refactoring
```bash
git commit -m "refactor: simplify path parsing logic"
```

## 🧪 Testing

Before creating a PR, ensure that:

```bash
# All tests pass
npm test

# No linting errors
npm run lint

# TypeScript compiles without errors
npm run type-check

# The project builds
npm run build

# Examples work
cd examples/react-router-demo
npm install
npm run build
```

### ✍️ Writing Tests

Comprehensive tests are crucial for maintaining the quality and stability of `@riogz/router`. We use [Jest](https://jestjs.io/) as our testing framework.

**General Guidelines:**

*   **Importance**: Every new feature should be accompanied by tests. Bug fixes should also include tests that demonstrate the issue and verify the fix.
*   **Coverage**: Aim for high test coverage. You can check coverage by running `npm run test:coverage`.
*   **Location**: Tests are typically located in `__tests__` subdirectories within the respective module\'s folder (e.g., `packages/router/modules/__tests__`). Test files should be named with a `.test.ts` or `.spec.ts` extension (e.g., `createRouter.test.ts`).
*   **Clarity**: Write clear and descriptive test names. The test description should make it obvious what is being tested.
    *   ✅ `it('should navigate to the correct route with params', () => { /* ... */ });`
    *   ❌ `it('test navigation', () => { /* ... */ });`
*   **Isolation**: Each test case should be isolated and test a specific scenario or unit of behavior. Avoid testing multiple unrelated things in a single test.
*   **Public API Focus**: Prioritize testing the public API and observable behavior of modules and functions rather than internal implementation details. This makes tests less brittle to refactoring.
*   **Edge Cases**: Don\'t forget to test edge cases, error conditions, and invalid inputs.
*   **Reliability**: Ensure your tests are reliable and not flaky. Avoid dependencies on external services or timing issues where possible.
*   **Examples**: Look at existing tests within the codebase for examples of how to structure your tests.

**What to Test:**

For a routing library, common things to test include:

*   Route matching (simple paths, paths with params, query params, wildcards).
*   Navigation to routes (`router.navigate()`).
*   Correct state updates after navigation (`router.getState()`, subscriptions).
*   Route guards (`canActivate`, `canDeactivate`).
*   Middleware functionality.
*   Plugin interactions (if applicable to your changes).
*   Path building (`router.buildPath()`).
*   Options and their effects on router behavior.
*   Error handling and lifecycle events.

**Running Tests:**

*   `npm test`: Run all tests.
*   `npm test:watch`: Run tests in watch mode, re-running on file changes.
*   `npm test:coverage`: Run tests and generate a coverage report.
*   You can also run tests for specific files by providing a pattern: `jest packages/router/modules/createRouter.test.ts`

By following these guidelines, you can help us ensure that `@riogz/router` remains a robust and reliable routing solution.

## 📋 PR Checklist

### Before creating a PR:
- [ ] Code follows the project style (check `npm run lint`)
- [ ] Tests added for new functionality
- [ ] All existing tests pass (`npm test`)
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] The project builds (`npm run build`)
- [ ] Documentation updated (if necessary)
- [ ] Conventional commits are used

### When creating a PR:
- [ ] **Correct target branch is selected** (`master` or `release/vX.Y.Z`)
- [ ] PR description filled out with an explanation of changes
- [ ] Appropriate labels added
- [ ] For hotfixes: maintainer approval obtained

## 🔄 What happens after creating a PR

1.  **Automatic Checks**: GitHub Actions will run tests on Node.js 16, 18, 20
2.  **Code Review**: Maintainers will review your code
3.  **Feedback**: Changes may be requested
4.  **Merge**: After approval, the PR will be merged into `master`
5.  **Automatic Release**: Your changes will be included in the next release

## 🎯 Detailed Guide to Target Branches

### ✅ **To `master`** (90% of cases):
- 🐛 Bug fixes for the next release
- ✨ New features
- 📚 Documentation improvements
- 🔧 Refactoring
- ⬆️ Dependency updates
- 🧪 Adding tests

### 🎯 **To `release/vX.Y.Z`** (only for critical cases):
- 🚨 Critical bugs blocking production
- 🔒 Security vulnerabilities
- 📦 Build/deploy fixes
- **⚠️ Requires prior agreement with maintainers**

### ❌ **DO NOT create PRs to:**
- Old release branches (`release/v1.0.0` if current is `v1.2.0`)
- Tags or commits
- Others\' feature branches

## 🚨 When is a hotfix to a release branch needed?

### Criteria for a hotfix:
- 🔥 **Critical bug** - the application does not work or works incorrectly
- 🔒 **Security vulnerability** - a serious security issue has been discovered
- 📦 **Build issue** - the package does not install or build
- 💥 **Regression** - a new version broke existing functionality

### Hotfix approval process:
1.  **Create an Issue** describing the problem and mark it as `critical`
2.  **Wait for a response** from maintainers (usually within 24 hours)
3.  **Get approval** to create a hotfix PR
4.  **Create a PR** to the corresponding `release/vX.Y.Z` branch

## 🤝 Interacting with Maintainers

### If your change is critical:
Indicate in the PR description:
```markdown
## 🚨 Criticality
This is a fix for a critical bug that is blocking users.

**Problem:** Description of the problem
**Impact:** Who it affects
**Solution:** Brief description of the fix

Propose to include in the next patch release.
```

### If it\'s a breaking change:
```markdown
## Breaking Change
⚠️ This change breaks backward compatibility.

**What changed:**
- API method `navigate()` now returns a Promise
- Removed deprecated method `goTo()`

**Migration:**
\`\`\`javascript
// Was
router.navigate(\'/path\')

// Now
await router.navigate(\'/path\')
\`\`\`
```

## 🐛 Reporting Bugs

Use [GitHub Issues](https://github.com/riogod/router/issues) for:
- Bug reports
- New feature proposals
- Usage questions

### Bug report template:
```markdown
## Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to \'...\'
2. Click on \'....\'
3. Scroll down to \'....\'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Environment
- Node.js version:
- Browser (if applicable):
- @riogz/router version:

## Reproducible Code Snippet
Provide a minimal code snippet or link to a repository that reproduces the issue.
\`\`\`javascript
// Your minimal example here
\`\`\`
```

## 📚 Useful Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Project Documentation](./README.md)
- [Usage Examples](./examples/)

## ❓ Questions?

If you have questions:
1. Check [Issues](https://github.com/riogod/router/issues) to see if it has been asked before.
2. Create a new Issue with the `question` tag.
3. Ask in your PR if the question is related to your changes.

---

**Remember**: Your contribution is valuable! Don\'t be afraid to create a PR, even if you\'re unsure about something. We\'ll help you get the changes to a perfect state. 🚀

## 🎯 Best Practices

### Commit Messages:
Use [Conventional Commits](https://www.conventionalcommits.org/):
```bash
feat: add new routing feature
fix: correct navigation bug
feat!: change router API (breaking change)
docs: update documentation
chore: update dependencies
```