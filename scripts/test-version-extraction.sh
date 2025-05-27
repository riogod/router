#!/bin/bash

echo "🔍 Testing version extraction..."

test_messages=(
  "Merge pull request #124 from user/release/v1.2.3-beta.1"
  "Merge pull request #127 from riogod/release/v0.0.5-alpha"
  "Merge pull request #128 from riogod/release/v2.0.0-rc.1"
)

for msg in "${test_messages[@]}"; do
  echo ""
  echo "Message: $msg"
  
  # Текущий паттерн
  current=$(echo "$msg" | grep -oE "release/v[0-9]+\.[0-9]+\.[0-9]+[a-zA-Z0-9\-\.]*" | sed 's/release\/v//')
  echo "Current extraction: '$current'"
  
  # Улучшенный паттерн
  improved=$(echo "$msg" | grep -oE "release/v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+(\.[0-9]+)?)?" | sed 's/release\/v//')
  echo "Improved extraction: '$improved'"
  
  # Ещё один вариант
  alternative=$(echo "$msg" | sed -n 's/.*release\/v\([0-9]\+\.[0-9]\+\.[0-9]\+[a-zA-Z0-9\-\.]*\).*/\1/p')
  echo "Alternative extraction: '$alternative'"
done 