# Troubleshooting: Recipe Patterns Loading Issue

## Problem Summary

When running `fast-plan generate -c test-prompt-dynamic.json`, users encountered these warnings:
- `⚠️ Could not load recipe patterns, using basic prompts`
- `⚠️ Dynamic variety prompt failed, falling back to template`

This prevented the dynamic variety prompts from working properly, causing meal plans to lack the intended variety in proteins, cooking methods, and seasonings.

## Root Cause Analysis

The issue had two main components:

### 1. File Path Resolution Problem
The `loadRecipePatterns()` function was using a hardcoded relative path:
```typescript
const patternsPath = path.join(__dirname, '../keto-recipe-patterns.json');
```

**Problem**: This worked in development (`__dirname` = `/src`) but failed when:
- Running the compiled version globally (`__dirname` = `/dist`)
- The file was located at different paths depending on installation method

### 2. ES Module Compatibility Issue
Chalk v5+ is an ES module but the project uses CommonJS, causing runtime errors:
```
Error [ERR_REQUIRE_ESM]: require() of ES Module chalk/source/index.js not supported
```

## Solution Applied

### Fix 1: Robust File Path Resolution
Updated `loadRecipePatterns()` to try multiple possible locations:

```typescript
function loadRecipePatterns(): any {
    try {
        // Try multiple possible locations for the patterns file
        const possiblePaths = [
            path.join(__dirname, '../keto-recipe-patterns.json'), // From source (dev)
            path.join(__dirname, 'keto-recipe-patterns.json'),    // From dist (installed)
            path.join(process.cwd(), 'keto-recipe-patterns.json'), // From project root
        ];

        for (const patternsPath of possiblePaths) {
            if (fs.existsSync(patternsPath)) {
                const patternsContent = fs.readFileSync(patternsPath, 'utf8');
                return JSON.parse(patternsContent);
            }
        }

        throw new Error('keto-recipe-patterns.json not found in any expected location');
    } catch (error) {
        console.warn(chalk.yellow('⚠️  Could not load recipe patterns, using basic prompts'));
        return null;
    }
}
```

### Fix 2: Downgrade Chalk to CommonJS-Compatible Version
```bash
npm install chalk@^4.1.2
```
Chalk v4 supports CommonJS while maintaining all functionality.

## Testing Options (No NPM Publish Required)

### Option 1: Development Version (Fastest)
```bash
npm run dev -- generate -c test-prompt-dynamic.json
```

### Option 2: Built Version
```bash
npm run build
node dist/index.js generate -c test-prompt-dynamic.json
```

### Option 3: Global Installation
```bash
npm install -g .
fast-plan generate -c test-prompt-dynamic.json
```

## Verification of Fix

After applying fixes, the command now:
- ✅ Loads recipe patterns successfully
- ✅ Generates dynamic variety prompts with proper variety requirements
- ✅ Creates meal plans with diverse proteins, cooking methods, and seasonings
- ✅ No longer shows the warning messages

## Future Prevention

### 1. File Path Best Practices
- Always use multiple fallback paths for critical resource files
- Consider using a configuration system for file locations
- Test with both development and installed scenarios

### 2. Dependency Management
- Regularly audit dependencies for ES module compatibility
- Consider using a tool like `are-the-types-wrong` to check compatibility
- Pin major versions in package.json to prevent breaking changes

### 3. Error Handling
- Provide clear error messages indicating what went wrong
- Include fallback behavior for critical functionality
- Log detailed error information during development

## Related Files Modified

- `src/index.ts`: Updated `loadRecipePatterns()` function
- `package.json`: Downgraded chalk dependency
- `dist/keto-recipe-patterns.json`: Copied during build process

## Testing Commands for Future Issues

When encountering similar issues:

1. **Check file loading**: `ls -la keto-recipe-patterns.json`
2. **Test path resolution**: `node -e "console.log(require('path').resolve('.'))"`
3. **Verify dependencies**: `npm ls chalk`
4. **Test different environments**: Development vs built vs global installation

## Lessons Learned

1. **Path resolution varies** between development, build, and installation contexts
2. **Dependencies matter** - ES modules can break CommonJS projects
3. **Fallback strategies** are crucial for robust file loading
4. **Multiple testing scenarios** prevent deployment issues
5. **Clear error messages** aid in faster debugging

---

*Documented: October 1, 2025*
*Issue resolved: Recipe patterns loading and dynamic variety prompts*
