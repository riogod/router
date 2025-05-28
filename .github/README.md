# CI/CD Documentation

Этот проект использует **GitHub Flow** с автоматизированными релизами.

## 🌊 GitHub Flow Process

### 📋 Основной процесс разработки:

1. **Создание фичи:**
   ```bash
   git checkout master
   git pull
   git checkout -b feature/my-awesome-feature
   # ... разработка ...
   git push -u origin feature/my-awesome-feature
   ```

2. **Pull Request в master:**
   - Создаете PR из `feature/my-awesome-feature` в `master`
   - Проходят CI проверки
   - Code review
   - Мерж в `master`

3. **Создание релиза:**
   - Используете **Create Release** workflow в GitHub Actions
   - Выбираете тип релиза (auto/patch/minor/major/prerelease)
   - Автоматически создается:
     - 🏷️ **Тег** (например, `v0.1.0`)
     - 📝 **Draft Release** с changelog
     - 🌿 **Release ветка** (например, `release/v0.1.0`)
     - 🔄 **Pull Request** в master

4. **Финализация релиза:**
   - Проверяете созданный PR
   - Мержите PR в `master`
   - Автоматически запускается **Deploy workflow**:
     - 📦 Публикует пакеты в npm
     - 🎉 Превращает Draft Release в полноценный релиз

## 🚀 Workflows

### 1. **CI Workflow** (`.github/workflows/ci.yml`)

**Триггеры:**
- Pull requests в `master` и `release/*` ветки
- Push в `master` и `release/*` ветки

**Что делает:**
- 🧪 Тестирование на Node.js 16.x, 18.x, 20.x, 22.x
- 🔍 Линтинг и проверка типов
- 🏗️ Сборка пакетов
- 🔒 Security audit
- 📊 Coverage отчеты
- 🔍 CodeQL анализ безопасности

**Path filtering:** Джобы запускаются только при изменении кода пакетов, не workflow файлов.

### 2. **Create Release Workflow** (`.github/workflows/create-release.yml`)

**Триггер:** Ручной запуск (workflow_dispatch)

**Параметры:**
- **version_type**: `auto` | `patch` | `minor` | `major` | `prerelease`
- **custom_version**: Кастомная версия (опционально)
- **release_notes**: Заметки к релизу (опционально)

**Что делает:**
1. 🔍 **Анализирует коммиты** (для `auto` режима):
   - `feat:` → minor релиз
   - `fix:` → patch релиз
   - `feat!:` или `fix!:` → major релиз
   - Остальное → patch релиз

2. 🏷️ **Создает тег** на текущем коммите

3. 🌿 **Создает release ветку** с обновленными версиями

4. 📝 **Создает Draft Release** с автоматическим changelog

5. 🔄 **Создает Pull Request** в master

**Пример использования:**
```bash
# Автоматическое определение типа релиза
GitHub Actions → Create Release → version_type: auto

# Конкретный тип релиза
GitHub Actions → Create Release → version_type: minor

# Кастомная версия
GitHub Actions → Create Release → custom_version: 1.0.0-beta.1
```

### 3. **Deploy Workflow** (`.github/workflows/deploy.yml`)

**Триггеры:**
- Push в `master` (только для release merges)
- Ручной запуск (workflow_dispatch)

**Логика деплоя:**
- ✅ Запускается ТОЛЬКО при мерже release ветки в master
- ❌ НЕ запускается для обычных коммитов в master

**Что делает:**
1. 🔍 **Проверяет версии** во всех пакетах
2. 🧪 **Запускает тесты** перед публикацией
3. 📦 **Публикует пакеты** в npm:
   - `latest` тег для стабильных версий
   - `beta` тег для prerelease версий
4. 🎉 **Обновляет GitHub Release**:
   - Превращает Draft в полноценный релиз
   - Добавляет ссылки на опубликованные пакеты

### 4. **CodeQL Workflow** (`.github/workflows/codeql.yml`)

**Триггеры:**
- Pull requests
- Push в `master`
- Еженедельно по расписанию

**Что делает:**
- 🔍 Анализ безопасности JavaScript/TypeScript кода
- 🚨 Поиск уязвимостей и проблем безопасности
- 📋 Отчеты в GitHub Security tab

## 📦 Package Management

### Структура пакетов:
```
packages/
├── router/                 # @riogz/router
├── react-router/          # @riogz/react-router  
├── router-helpers/        # @riogz/router-helpers
├── router-plugin-browser/ # @riogz/router-plugin-browser
├── router-plugin-logger/  # @riogz/router-plugin-logger
├── router-plugin-persistent-params/ # @riogz/router-plugin-persistent-params
└── router-transition-path/ # @riogz/router-transition-path
```

### Версионирование:
- Все пакеты используют **одинаковую версию**
- Версии обновляются автоматически в release ветках
- Поддерживаются prerelease версии (например, `1.0.0-beta.1`)

## 🔧 Configuration

### Environment Variables (в `.cursor/mcp.json` для MCP):
```json
{
  "env": {
    "NPM_TOKEN": "your-npm-token",
    "GITHUB_TOKEN": "auto-provided"
  }
}
```

### Required Secrets:
- `NPM_TOKEN`: Токен для публикации в npm
- `GITHUB_TOKEN`: Автоматически предоставляется GitHub Actions

## 📋 Branch Protection Rules

### Master Branch:
- ✅ Require pull request reviews
- ✅ Require status checks:
  - `ci-success` (объединенный статус всех CI проверок)
  - `Analyze (javascript-typescript)` (CodeQL)
- ✅ Require branches to be up to date
- ✅ Restrict pushes that create files larger than 100MB

## 🎯 Best Practices

### Commit Messages:
Используйте [Conventional Commits](https://www.conventionalcommits.org/):
```bash
feat: добавить новую функцию роутинга
fix: исправить баг с навигацией  
feat!: изменить API роутера (breaking change)
docs: обновить документацию
chore: обновить зависимости
```

### Release Process:
1. **Разработка** → PR в `master` → мерж
2. **Готовность к релизу** → Create Release workflow
3. **Проверка** → review созданного PR
4. **Публикация** → мерж release PR → автоматический деплой

### Hotfixes:
Для критических исправлений:
1. Создайте PR прямо в `master`
2. После мержа запустите Create Release workflow с типом `patch`

## 🚨 Troubleshooting

### Deploy не запускается:
- Проверьте, что commit message содержит паттерн release merge
- Убедитесь, что это мерж из `release/vX.Y.Z` ветки

### CI проверки пропускаются:
- Это нормально, если изменились только workflow файлы
- Path filtering автоматически определяет, нужно ли запускать тесты

### Пакеты не публикуются:
- Проверьте `NPM_TOKEN` в secrets
- Убедитесь, что версии во всех пакетах одинаковые
- Проверьте, что версия еще не опубликована

## 📚 Links

- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry) 