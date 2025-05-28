# Changelog Generation Guide

This project uses an advanced automated changelog generation system based on [Conventional Commits](https://www.conventionalcommits.org/).

## 🚀 How It Works

### Automatic Generation
The changelog is automatically generated during the release process:

1. **Create Release workflow** runs `scripts/generate-changelog.js`
2. Analyzes commits since the last tag
3. Groups commits by type and scope
4. Generates formatted changelog with links
5. Updates `CHANGELOG.md` in the release branch

### Manual Generation
You can also generate changelog manually:

```bash
# Generate changelog for a specific version
npm run changelog 0.1.0

# Generate from specific tag
npm run changelog 0.1.0 v0.0.9

# Include all commit types (including chore, style, test)
npm run changelog:all 0.1.0
```

## 📝 Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type | Description | Changelog Section |
|------|-------------|-------------------|
| `feat` | New feature | ✨ Features |
| `fix` | Bug fix | 🐛 Bug Fixes |
| `perf` | Performance improvement | ⚡ Performance Improvements |
| `refactor` | Code refactoring | ♻️ Code Refactoring |
| `docs` | Documentation changes | 📚 Documentation |
| `build` | Build system changes | 🔧 Build System & CI |
| `ci` | CI configuration changes | 🔧 Build System & CI |
| `style` | Code style changes | 📝 Other Changes* |
| `test` | Test changes | 📝 Other Changes* |
| `chore` | Maintenance tasks | 📝 Other Changes* |

*Only included when using `npm run changelog:all`

### Breaking Changes

Add `!` after the type/scope to indicate breaking changes:

```bash
feat!: remove deprecated API
feat(api)!: change response format
```

Breaking changes get their own section: 💥 BREAKING CHANGES

### Scopes

Use scopes to categorize changes:

```bash
feat(router): add new navigation method
fix(hooks): resolve useRouter memory leak
docs(readme): update installation guide
```

## 🎯 Examples

### Good Commit Messages

```bash
feat: add user authentication
fix(router): resolve navigation bug in Safari
perf: improve route matching performance
docs: add API documentation
feat!: remove deprecated createRouter function
```

### Generated Changelog

```markdown
## [1.2.0](https://github.com/riogod/router/compare/v1.1.0...v1.2.0) (2025-05-28)

### 💥 BREAKING CHANGES

- **router**: remove deprecated createRouter function ([a1b2c3d](https://github.com/riogod/router/commit/a1b2c3d))

### ✨ Features

- add user authentication ([e4f5g6h](https://github.com/riogod/router/commit/e4f5g6h))

### 🐛 Bug Fixes

- **router**: resolve navigation bug in Safari ([i7j8k9l](https://github.com/riogod/router/commit/i7j8k9l))

### ⚡ Performance Improvements

- improve route matching performance ([m1n2o3p](https://github.com/riogod/router/commit/m1n2o3p))

### 📚 Documentation

- add API documentation ([q4r5s6t](https://github.com/riogod/router/commit/q4r5s6t))
```

## 🔧 Configuration

### Generator Options

The changelog generator supports various options:

```javascript
const ChangelogGenerator = require('./scripts/generate-changelog');

const generator = new ChangelogGenerator({
  fromTag: 'v1.0.0',           // Start from specific tag
  toTag: 'HEAD',               // End at specific tag/commit
  outputFile: 'CHANGELOG.md',  // Output file path
  repoUrl: 'https://github.com/riogod/router', // Repository URL
  includeAll: false            // Include all commit types
});

generator.generate('1.1.0');
```

### Environment Variables

- `INCLUDE_ALL=true` - Include all commit types (style, test, chore)

## 📋 Best Practices

### 1. Write Clear Commit Messages
```bash
# ✅ Good
feat(router): add support for nested routes
fix(hooks): prevent memory leak in useRouter

# ❌ Bad
update stuff
fix bug
```

### 2. Use Appropriate Types
```bash
# ✅ Good
feat: add new feature
fix: resolve bug
docs: update documentation

# ❌ Bad
update: add new feature
change: fix bug
```

### 3. Include Scope When Relevant
```bash
# ✅ Good for monorepo
feat(react-router): add new hook
fix(router-core): resolve navigation issue

# ✅ Good for specific areas
feat(api): add new endpoint
fix(ui): resolve button styling
```

### 4. Reference Issues and PRs
```bash
feat: add user authentication (#123)
fix: resolve navigation bug (closes #456)
```

## 🚀 Release Process Integration

The changelog generation is integrated into the release process:

1. **Create Release** workflow generates changelog
2. **CHANGELOG.md** is updated in the release branch
3. **GitHub Release** uses the same changelog content
4. **Pull Request** shows what will be included

This ensures consistency across all release artifacts.

## 🛠️ Troubleshooting

### No Commits Found
If no conventional commits are found, the generator creates a generic entry:

```markdown
### 📝 Other Changes
- Updates and improvements
```

### Missing Links
Ensure your repository URL is correctly configured in `package.json` or the generator options.

### Incorrect Grouping
Check that your commit messages follow the conventional commits format exactly.

## 📚 Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit) 