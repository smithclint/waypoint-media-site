# Pre-commit Development Workflow

This document explains how to use the pre-commit setup for the Waypoint Media website.

## Setup (One-time)

The pre-commit hooks are already installed! When you clone this repository, run:

```bash
# Install Poetry dependencies (includes pre-commit)
poetry install

# Install the pre-commit hooks
poetry run pre-commit install
```

## Daily Usage

### Automatic (Recommended)

Pre-commit hooks run automatically when you commit:

```bash
git add .
git commit -m "Your commit message"
# Hooks run automatically and fix issues
```

If hooks fail and modify files, you'll need to add and commit again:

```bash
git add .
git commit -m "Your commit message"
```

### Manual Testing

Run hooks on all files manually:

```bash
# Run all hooks on all files
poetry run pre-commit run --all-files

# Run specific hook
poetry run pre-commit run prettier --all-files
poetry run pre-commit run trailing-whitespace --all-files
```

### Run on Specific Files

```bash
poetry run pre-commit run --files index.html styles.css
```

## What the Hooks Do

### File Quality

- **trailing-whitespace**: Removes trailing spaces
- **end-of-file-fixer**: Ensures files end with newline
- **check-merge-conflict**: Detects merge conflict markers
- **check-case-conflict**: Prevents case-sensitive filename conflicts

### Code Formatting

- **prettier**: Formats HTML, CSS, JS, and Markdown files
- **black**: Formats Python code (for future scripts)
- **isort**: Sorts Python imports

### Security & Best Practices

- **detect-secrets**: Scans for accidentally committed secrets
- **check-added-large-files**: Prevents large files (>5MB)

### Syntax Validation

- **check-json**: Validates JSON syntax
- **check-yaml**: Validates YAML syntax
- **check-toml**: Validates TOML syntax

## Configuration Files

- `.pre-commit-config.yaml`: Main pre-commit configuration
- `.prettierrc`: Prettier formatting rules
- `.secrets.baseline`: Allowed secrets baseline
- `pyproject.toml`: Poetry and Python project configuration

## Skipping Hooks (Emergency Only)

To skip pre-commit hooks (not recommended):

```bash
git commit -m "Emergency fix" --no-verify
```

## Updating Hooks

Update to latest versions:

```bash
poetry run pre-commit autoupdate
```

## Troubleshooting

### Hooks are too slow

```bash
# Skip specific slow hooks
SKIP=detect-secrets git commit -m "Quick fix"
```

### False positive in secrets detection

Add to the file:

````python
### False positive in secrets detection
Add to the file:
```python
# This is not a secret  # pragma: allowlist secret
example_key = "not-a-real-key-just-example"  # pragma: allowlist secret
````

```

### Prettier conflicts with your formatting

Adjust `.prettierrc` or add files to `.prettierignore`

## Benefits

✅ **Consistent Code Style**: All HTML, CSS, and JS formatted consistently
✅ **Catch Errors Early**: Syntax errors caught before commit
✅ **Security**: Prevents accidental secret commits
✅ **Clean History**: No formatting-only commits
✅ **Team Collaboration**: Everyone uses same standards
```
