#!/bin/bash
# Hook: Run lint (ESLint + Prettier) and TypeScript type check, block if either fails
# Used as a Stop hook to ensure code quality before Claude finishes

set -o pipefail

cd "$CLAUDE_PROJECT_DIR" || exit 1

# Run eslint --fix (includes prettier via eslint-plugin-prettier)
fix_output=$(npm run format 2>&1)
fix_result=$?

if [ $fix_result -ne 0 ]; then
    cat >&2 << EOF
ESLint/Prettier fix failed. Please fix the issues.

$fix_output
EOF
    exit 2
fi

# Verify no warnings remain (matching pre-commit hook's --max-warnings=0)
lint_output=$(npx eslint --max-warnings=0 'src/**/*.{js,jsx,ts,tsx}' 2>&1)
lint_result=$?

if [ $lint_result -ne 0 ]; then
    cat >&2 << EOF
ESLint warnings found. Please fix the issues.

$lint_output
EOF
    exit 2
fi

# Run TypeScript type checking
tsc_output=$(npx tsc --noEmit 2>&1)
tsc_result=$?

if [ $tsc_result -ne 0 ]; then
    cat >&2 << EOF
TypeScript type check failed. Please fix the type errors.

$tsc_output
EOF
    exit 2
fi

exit 0