# Changelog



## [0.0.14](https://github.com/riogod/router/compare/v0.0.13...v0.0.14) (2025-05-28)

### ✨ Features

- **router**: add params to navigation NOT_FOUND error object ([3a2b5e2](https://github.com/riogod/router/commit/3a2b5e28c458c442ec1f10ec4a52749370547e0d))
- **changelog**: enhance release process with complete changelog generation and draft cleanup ([30110b5](https://github.com/riogod/router/commit/30110b568c9f9807268c76cace9556d57354b878))

### 🐛 Bug Fixes

- **path-parser**: Handle Unicode characters and emojis in query parameters  (#19) ([#19](https://github.com/riogod/router/pull/19)) ([d995b5a](https://github.com/riogod/router/commit/d995b5a4a6eeb3dc94a159abcdaf911fa713cdd7))
- **router**: resolve cloneRouter shared rootNode issue ([c137091](https://github.com/riogod/router/commit/c1370915e88c539b5bec5dae967653f7576d2bbc))
- **transition**: remove unused variable _titleRoute to resolve CodeQL warning - Remove useless assignment to local variable _titleRoute in updateBrowserTitle function - Variable was assigned routeName value but never used afterwards - Fixes CodeQL alert #2: Useless assignment to local variable - Maintains same functionality while improving code quality - Fixes: https://github.com/riogod/router/security/code-scanning/2 ([9083bfb](https://github.com/riogod/router/commit/9083bfb6bc3101e9d5d4bbdd62a9abf0141b0793))
- **router-helpers**: properly escape all regex special characters in normaliseSegment - Fix incomplete string escaping security issue identified by CodeQL - Replace simple dot escaping with comprehensive regex character escaping - Escape backslashes, dots, and all other regex metacharacters - Add comprehensive tests for special character handling - Ensure route segments with special characters are treated as literals - Fixes: https://github.com/riogod/router/security/code-scanning/1 ([f1bd59c](https://github.com/riogod/router/commit/f1bd59c0b2c15c4a73a012477e2dcd8a1c6a555e))

## [0.0.13](https://github.com/riogod/router/compare/v0.0.12...v0.0.13) (2025-05-28)

### ✨ Features

- **changelog**: implement advanced automated changelog generation with conventional commits support, grouping, links, and comprehensive documentation ([e7c4fd6](https://github.com/riogod/router/commit/e7c4fd6ce96478b09b778656c511502c2714fc82))
- **ci**: translate all workflows to English and fix release notes variables ([b88f303](https://github.com/riogod/router/commit/b88f3036f6a41e568c2f03ea39c6d7bcb41fdc6b))
- **ci**: add release label to PR creation ([f48662c](https://github.com/riogod/router/commit/f48662c118f88b79e37e0c8ec79f9e9b88353da2))

## [0.0.12](https://github.com/riogod/router/compare/v0.0.3...v0.0.12) (2025-05-28)

## [0.0.3](https://github.com/riogod/router/compare/v0.0.2...v0.0.3) (2025-05-17)

## [0.0.2](https://github.com/riogod/router/compare/v0.0.1...v0.0.2) (2025-05-17)

## 0.0.1 (2025-05-17)
