# Changelog

## [1.0.4](https://github.com/riogod/router/compare/v1.0.3...v1.0.4) (2025-12-03)

### 🐛 Bug Fixes

- **router**: add support for forwardTo pointing to non-existent route ([f8351e9](https://github.com/riogod/router/commit/f8351e9bee4a254ffdf278977687086c61984dab))

## [1.0.3](https://github.com/riogod/router/compare/v1.0.2...v1.0.3) (2025-10-01)

### ✨ Features

- **router**: add support for composite route names ([f8351e9](https://github.com/riogod/router/commit/f8351e9bee4a254ffdf278977687086c61984dab))

### 🐛 Bug Fixes

- **router**: make lifecycle hooks non-blocking for faster navigation ([c8492ad](https://github.com/riogod/router/commit/c8492adee546be23d96a983f5c4c53b30c023c2f))

## [1.0.2](https://github.com/riogod/router/compare/v1.0.1...v1.0.2) (2025-06-23)

### ✨ Features

- implement local symbol-observable to remove external dependency. Now @riogz/router is a zero-deps library. ([e048fbb](https://github.com/riogod/router/commit/e048fbb4da0e43c86db7a6adace8572c41537b11))

## [1.0.1](https://github.com/riogod/router/compare/v1.0.0...v1.0.1) (2025-05-30)

### ✨ Features

- **router**: add node now will be update existed nodes and childrens ([706cf52](https://github.com/riogod/router/commit/706cf52428380024103a4914b713f1c8ffcb9a3a))

## [1.0.0](https://github.com/riogod/router/compare/v0.0.16...v1.0.0) (2025-05-29)

### ✨ Features

- **router**: Added removeNode to Core API. It will be remove target node and all children. ([e86fc50](https://github.com/riogod/router/commit/e86fc50a849475c07f1a9619d9e5c7e0182a0eaa))

### 📚 Documentation

- **router**: Refactor documentation ([40fa957](https://github.com/riogod/router/commit/40fa957a5330606982fbe80c506b62625269e9df))

## [0.0.16](https://github.com/riogod/router/compare/v0.0.15...v0.0.16) (2025-05-29)

## [0.0.15](https://github.com/riogod/router/compare/v0.0.14...v0.0.15) (2025-05-28)

### 🐛 Bug Fixes

- **deploy**: add support for chore(release) commit format in deploy workflow - Add pattern to recognize 'chore(release): bump version to X.X.X' commits - Update regex to extract version numbers without 'v' prefix - Improve version extraction for release commits - Ensures automatic deployment triggers for release commits - Fixes deployment issue where release commits were not recognized ([d4a49db](https://github.com/riogod/router/commit/d4a49db7d61d13b56d204ba86d98f2c3426b2f4d))

## [0.0.14](https://github.com/riogod/router/compare/v0.0.13...v0.0.14) (2025-05-28)

### ✨ Features

- **router**: add params to navigation NOT_FOUND error object ([3a2b5e2](https://github.com/riogod/router/commit/3a2b5e28c458c442ec1f10ec4a52749370547e0d))
- **changelog**: enhance release process with complete changelog generation and draft cleanup ([30110b5](https://github.com/riogod/router/commit/30110b568c9f9807268c76cace9556d57354b878))

### 🐛 Bug Fixes

- **path-parser**: Handle Unicode characters and emojis in query parameters (#19) ([#19](https://github.com/riogod/router/pull/19)) ([d995b5a](https://github.com/riogod/router/commit/d995b5a4a6eeb3dc94a159abcdaf911fa713cdd7))
- **router**: resolve cloneRouter shared rootNode issue ([c137091](https://github.com/riogod/router/commit/c1370915e88c539b5bec5dae967653f7576d2bbc))
- **transition**: remove unused variable \_titleRoute to resolve CodeQL warning - Remove useless assignment to local variable \_titleRoute in updateBrowserTitle function - Variable was assigned routeName value but never used afterwards - Fixes CodeQL alert #2: Useless assignment to local variable - Maintains same functionality while improving code quality - Fixes: https://github.com/riogod/router/security/code-scanning/2 ([9083bfb](https://github.com/riogod/router/commit/9083bfb6bc3101e9d5d4bbdd62a9abf0141b0793))
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
