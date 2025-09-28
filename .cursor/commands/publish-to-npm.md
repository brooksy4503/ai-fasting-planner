# Publishing AI Fasting Planner to NPM

This guide walks you through publishing the AI Fasting Planner CLI tool to npm.

## Prerequisites

1. **npm account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **npm CLI logged in**: Run `npm login` and enter your credentials
3. **Clean working directory**: Commit all changes to git
4. **Valid package.json**: Ensure all fields are correct

## Pre-Publication Checklist

### 1. Verify Package Configuration

Check that `package.json` has all required fields:

```bash
# Verify package name is available
npm view ai-fasting-planner

# If package exists, you may need to:
# - Use a scoped package: @yourusername/ai-fasting-planner
# - Choose a different name
```

### 2. Update Version

```bash
# For patch releases (bug fixes)
npm version patch

# For minor releases (new features)
npm version minor

# For major releases (breaking changes)
npm version major

# Or manually update version in package.json
```

### 3. Build and Test

```bash
# Clean previous builds
rm -rf dist/

# Install dependencies
npm install

# Build the project
npm run build

# Test the built version locally
node dist/index.js --help
node dist/index.js generate --config test-config.json

# Test as global package (optional)
npm link
fast-plan --help
npm unlink ai-fasting-planner
```

### 4. Verify Package Contents

```bash
# See what files will be published
npm pack --dry-run

# This should include:
# - dist/ directory with compiled JS
# - README.md
# - package.json
# - Any other files listed in "files" field
```

## Publishing Process

### 1. Login to npm

```bash
npm login
# Enter your npm username, password, and email
```

### 2. Publish to npm

```bash
# For first-time publishing
npm publish

# For scoped packages (if needed)
npm publish --access public

# For beta/pre-release versions
npm publish --tag beta
```

### 3. Verify Publication

```bash
# Check your package on npm
npm view ai-fasting-planner

# Test installation from npm
npm install -g ai-fasting-planner
fast-plan --help
```

## Post-Publication Steps

### 1. Tag the Release in Git

```bash
# Create and push git tag
git tag v$(node -p "require('./package.json').version")
git push origin --tags
```

### 2. Update Documentation

- Update README.md with new version info
- Add release notes if significant changes
- Update any installation instructions

### 3. Test Installation

```bash
# Test global installation
npm install -g ai-fasting-planner
fast-plan generate

# Test npx usage
npx ai-fasting-planner generate
```

## Automated Publishing Workflow

### Option 1: GitHub Actions (Recommended)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Test
        run: npm test
      
      - name: Publish to NPM
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Option 2: Manual Release Script

Create `scripts/release.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting release process..."

# Ensure clean working directory
if [[ -n $(git status --porcelain) ]]; then
  echo "❌ Working directory is not clean. Please commit changes first."
  exit 1
fi

# Build and test
echo "🔨 Building project..."
npm run build

echo "🧪 Running tests..."
npm test

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"

# Publish to npm
echo "📤 Publishing to npm..."
npm publish

# Create git tag
echo "🏷️  Creating git tag..."
git tag "v$CURRENT_VERSION"
git push origin "v$CURRENT_VERSION"

echo "✅ Release complete! Version $CURRENT_VERSION published."
echo "🔗 View at: https://www.npmjs.com/package/ai-fasting-planner"
```

Make it executable:
```bash
chmod +x scripts/release.sh
```

## Version Management Strategy

### Semantic Versioning

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

### Release Types

```bash
# Bug fixes
npm version patch && npm publish

# New features
npm version minor && npm publish

# Breaking changes
npm version major && npm publish

# Pre-release versions
npm version prerelease --preid=beta && npm publish --tag beta
```

## Troubleshooting

### Common Issues

1. **Package name already exists**
   ```bash
   # Use scoped package
   npm init --scope=@yourusername
   # Update package.json name to "@yourusername/ai-fasting-planner"
   ```

2. **Permission denied**
   ```bash
   # Ensure you're logged in
   npm whoami
   npm login
   ```

3. **Build files missing**
   ```bash
   # Ensure dist/ directory exists and is built
   npm run build
   ls -la dist/
   ```

4. **Binary not working after install**
   ```bash
   # Check bin field in package.json
   # Ensure dist/index.js has shebang: #!/usr/bin/env node
   # Verify file permissions
   chmod +x dist/index.js
   ```

### Testing Before Publishing

```bash
# Test package locally
npm pack
tar -tzf ai-fasting-planner-*.tgz

# Install from tarball
npm install -g ./ai-fasting-planner-*.tgz
fast-plan --help

# Clean up
npm uninstall -g ai-fasting-planner
rm ai-fasting-planner-*.tgz
```

## Security Considerations

1. **API Keys**: Ensure no API keys are in published code
2. **Environment Files**: Verify `.env*` files are in `.npmignore`
3. **Dependencies**: Audit dependencies before publishing
   ```bash
   npm audit
   npm audit fix
   ```

## Maintenance

### Regular Updates

1. **Dependencies**: Update regularly for security
   ```bash
   npm update
   npm audit fix
   ```

2. **Node.js Compatibility**: Test with different Node versions
3. **Documentation**: Keep README.md current with features

### Deprecation (if needed)

```bash
# Deprecate a version
npm deprecate ai-fasting-planner@1.0.0 "Please upgrade to 1.0.1"

# Unpublish (only within 72 hours)
npm unpublish ai-fasting-planner@1.0.0
```

## Quick Reference

```bash
# Complete publishing workflow
npm run build
npm test
npm version patch
npm publish
git push origin --tags

# Check publication
npm view ai-fasting-planner
npm install -g ai-fasting-planner
fast-plan --help
```
