#!/bin/bash

echo "🧪 Testing release merge detection logic..."

# Тестовые commit messages
test_messages=(
  "Merge pull request #123 from riogod/release/v0.0.5"
  "Merge pull request #124 from user/release/v1.2.3-beta.1"
  "Merge branch 'release/v2.0.0'"
  "Merge pull request #125 from riogod/feature/new-feature"
  "Merge pull request #126 from riogod/fix/bug-fix"
  "feat: add new feature"
  "fix: resolve issue"
  "Merge pull request #127 from riogod/release/v0.0.5-alpha"
)

echo ""
echo "Testing commit messages:"
echo "========================"

for msg in "${test_messages[@]}"; do
  echo ""
  echo "Message: $msg"
  
  IS_RELEASE_MERGE="false"
  TARGET_VERSION=""
  
  # Проверяем паттерн merge commit из release ветки (включая суффиксы)
  if echo "$msg" | grep -qE "Merge pull request .* from .*/release/v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+(\.[0-9]+)?)?"; then
    IS_RELEASE_MERGE="true"
    # Извлекаем версию из commit message (включая суффиксы типа -beta.1, -alpha)
    TARGET_VERSION=$(echo "$msg" | grep -oE "release/v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+(\.[0-9]+)?)?" | sed 's/release\/v//')
    echo "✅ Detected release merge with target version: $TARGET_VERSION"
  elif echo "$msg" | grep -qE "Merge branch 'release/v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+(\.[0-9]+)?)?"; then
    IS_RELEASE_MERGE="true"
    TARGET_VERSION=$(echo "$msg" | grep -oE "release/v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+(\.[0-9]+)?)?" | sed 's/release\/v//')
    echo "✅ Detected direct release branch merge with target version: $TARGET_VERSION"
  else
    echo "❌ Not a release merge - deployment would be skipped"
  fi
  
  echo "   Is release merge: $IS_RELEASE_MERGE"
  echo "   Target version: $TARGET_VERSION"
done

echo ""
echo "🎯 Summary:"
echo "- Only merges from release/vX.Y.Z branches will trigger deployment"
echo "- Regular feature/fix merges will be skipped"
echo "- Version is extracted from branch name in commit message" 