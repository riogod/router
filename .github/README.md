# GitHub Actions Workflows

Этот проект использует GitHub Actions для автоматизации CI/CD процессов.

## 🔄 Workflows

### 1. **CI Workflow** (`.github/workflows/ci.yml`)

**Триггеры:**
- Pull requests в `master` и `release/v*` ветки
- Push в `master`
- Ручной запуск

**Что делает:**
- ✅ Запускает тесты на Node.js 16, 18, 20, 22
- 🔍 Проверяет линтинг и TypeScript компиляцию
- 🏗️ Собирает пакеты
- 🛡️ Проверяет безопасность (npm audit)
- 📊 Генерирует coverage отчеты (только для PR)
- 💬 Комментирует PR при ошибках
- ✅ Работает одинаково для PR в master и release ветки

### 2. **Deploy Workflow** (`.github/workflows/deploy.yml`)

**Триггеры:**
- Push в `master` (после мержа PR)
- Ручной запуск с выбором типа версии

**Что делает:**
- 🔍 Проверяет нужен ли деплой (есть ли изменения в packages/)
- ✅ Запускает тесты
- 📦 Собирает пакеты
- 🏷️ Автоматически определяет тип версии по коммитам
- 🚀 Публикует в npm
- 📝 Создает GitHub Release

### 3. **CodeQL Workflow** (`.github/workflows/codeql.yml`)

**Триггеры:**
- Pull requests в `master`
- Push в `master`
- Еженедельно по расписанию (понедельник)

**Что делает:**
- 🔍 Сканирует код на уязвимости безопасности
- 📊 Анализирует JavaScript/TypeScript код
- 🛡️ Создает отчеты о безопасности в GitHub Security

### 4. **Publish Workflow** (`.github/workflows/publish.yml`)

**Триггеры:**
- Push тегов `v*.*.*`
- Ручной запуск

**Что делает:**
- 📦 Публикует пакеты в npm при создании тега





## 🌳 Стратегия веток

### **Master Branch**
- Основная ветка разработки
- PR мержатся сюда после прохождения всех проверок
- Автоматический деплой при мерже

### **Release Branches** (`release/vX.Y.Z`)
- Ветки для подготовки релизов с точной версией в имени
- Формат: `release/v1.0.1`, `release/v1.0.1-beta`, `release/v2.0.0-alpha.1`
- PR из release веток в `master` автоматически устанавливают версию из имени ветки
- Специальные проверки и комментарии в PR
- Автоматический деплой с точной версией при мерже

### **Feature Branches**
- Фичевые ветки для разработки
- Могут создавать PR в `master` или `release/vX.Y.Z`
- Тесты запускаются при создании/обновлении PR
- При PR в release ветку проходят те же проверки, что и для master

## 🚀 Процесс релиза

### Release Branch (рекомендуется для версионных релизов)
1. Создайте ветку `release/vX.Y.Z` (например, `release/v1.0.1-beta`)
2. Добавьте фичи и исправления в эту ветку
3. Создайте PR из `release/vX.Y.Z` в `master`
4. Система автоматически:
   - Проверит формат версии в имени ветки
   - Запустит все тесты и проверки
   - Добавит комментарий с информацией о релизе
5. После мержа версия будет установлена точно как в имени ветки
6. Автоматически создастся тег и произойдет деплой

### Автоматический (для обычных обновлений)
1. Создайте PR в `master`
2. После мержа автоматически запустится деплой
3. Версия определится по типу коммитов:
   - `feat!:` → major
   - `feat:` → minor  
   - `fix:` → patch

### Ручной
1. Перейдите в Actions → Deploy
2. Нажмите "Run workflow"
3. Выберите тип версии (patch/minor/major/prerelease)

## 📋 Требования для мержа

### Branch Protection Rules
Настройте в Settings → Branches для `master`:

- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Required status checks:
  - `Test (Node 16.x)`
  - `Test (Node 18.x)` 
  - `Test (Node 20.x)`
  - `Test (Node 22.x)`
  - `build`
  - `security`
  - `Analyze (javascript-typescript)`
- ✅ Require pull request reviews before merging
- ✅ Dismiss stale PR approvals when new commits are pushed

### Workflow Permissions
Убедитесь, что в Settings → Actions → General:
- ✅ Workflow permissions: "Read and write permissions"
- ✅ Allow GitHub Actions to create and approve pull requests: включено

## 🔐 Секреты

Добавьте в Settings → Secrets and variables → Actions:

- `NPM_TOKEN` - токен для публикации в npm
- `CODECOV_TOKEN` - токен для Codecov (опционально)

## 🏷️ Conventional Commits

Используйте conventional commits для автоматического определения версий:

```bash
feat: add new router feature          # minor version bump
fix: resolve navigation bug           # patch version bump  
feat!: breaking change in API        # major version bump
docs: update README                   # no version bump
```


## 📊 Статусы и badges

Добавьте в README.md:

```markdown
[![CI](https://github.com/riogod/router/actions/workflows/ci.yml/badge.svg)](https://github.com/riogod/router/actions/workflows/ci.yml)
[![Deploy](https://github.com/riogod/router/actions/workflows/deploy.yml/badge.svg)](https://github.com/riogod/router/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/riogod/router/branch/master/graph/badge.svg)](https://codecov.io/gh/riogod/router)
```

## 📋 Примеры использования Release веток

### Создание release ветки для патча
```bash
# Создаем ветку для версии 1.0.1
git checkout -b release/v1.0.1
git push -u origin release/v1.0.1

# Добавляем исправления
git add .
git commit -m "fix: resolve critical bug"
git push

# Создаем PR в master
gh pr create --title "Release v1.0.1" --body "Bug fixes for v1.0.1"
```

### Работа с feature ветками в release
```bash
# Создаем release ветку
git checkout -b release/v1.2.0
git push -u origin release/v1.2.0

# Создаем feature ветку от release
git checkout -b feature/new-api release/v1.2.0
git push -u origin feature/new-api

# Разрабатываем фичу
git add .
git commit -m "feat: implement new API endpoint"
git push

# Создаем PR в release ветку (не в master!)
gh pr create --base release/v1.2.0 --title "Add new API" --body "New API for v1.2.0"

# После мержа feature в release, создаем PR release в master
git checkout release/v1.2.0
gh pr create --title "Release v1.2.0" --body "New release with API improvements"
```

### Создание pre-release ветки
```bash
# Создаем ветку для бета версии
git checkout -b release/v2.0.0-beta.1
git push -u origin release/v2.0.0-beta.1

# Добавляем экспериментальные фичи
git add .
git commit -m "feat!: breaking changes for v2"
git push

# Создаем PR в master
gh pr create --title "Release v2.0.0-beta.1" --body "Beta release with breaking changes"
``` 