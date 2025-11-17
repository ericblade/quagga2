# GitHub Copilot Instructions for Quagga2

## Repository Overview

Quagga2 is a barcode scanner library written in TypeScript that bundles all dependencies with Webpack. The project produces standalone browser (`dist/quagga.min.js`) and Node.js (`lib/quagga.js`) builds.

## Key Architecture Principles

1. **All dependencies are bundled** - Consumers never install our dependencies directly, so everything goes in `devDependencies`
2. **TypeScript 5.9.3** - We use modern TypeScript with strict type checking
3. **Webpack 4** - Pinned due to compatibility constraints (v5 migration not yet done)
4. **Old test tooling** - mocha@5, chai@4 are pinned (newer versions have breaking changes)

## Critical Files to Maintain

### DEPENDENCIES.md

**Always check if `DEPENDENCIES.md` needs updating when:**

- Adding, removing, or upgrading any npm package
- Changing what packages are imported in `src/` files
- Modifying build configuration (webpack, babel)
- Discovering security vulnerabilities or applying overrides
- Changing version pinning strategy in `.ncurc.json`

**Update these sections:**
- "Runtime Code Dependencies" - if adding/removing imports
- "Build & Development Tools" - if adding dev tooling
- "Overrides" - if modifying `package.json` overrides field
- "Bundle Size Impact" - if adding runtime dependencies
- "Security Considerations" - if addressing CVEs
- "Version Constraints" - if pinning versions in `.ncurc.json`
- "Last updated" date at bottom

### .ncurc.json

This file controls which packages `npm-check-updates` can upgrade:

```json
{
  "reject": ["mocha", "@types/mocha", "webpack", "webpack-cli", "cypress", "@cypress/*", "babel-loader", "source-map-loader", "chai", "eslint"]
}
```

**When adding to reject list:**
- Document the reason in `DEPENDENCIES.md` → "Version Constraints" → "Pinned Versions"
- Explain what breaks if the package is upgraded

### package.json

**Special considerations:**
- All dependencies go in `devDependencies` (we bundle everything)
- `overrides` field is used for security fixes of transitive dependencies
- Version pinning is handled by `.ncurc.json`, not strict versions here

## Development Workflow

### Before Making Changes

1. Run `git status` to check current branch (should be on `dev` or feature branch, not `master`)
2. Run `npm run check-types` to verify TypeScript compiles
3. Run `npm run lint` to check code style

### When Adding Dependencies

1. **Determine dependency type:**
   - Is it imported in `src/` code? → Runtime dependency (but still goes in `devDependencies`)
   - Is it only used by build tools? → Build tool (in `devDependencies`)

2. **Check bundle impact:**
   ```bash
   npm install --save-dev <package>
   npm run build:prod
   # Check size of dist/quagga.min.js before and after
   ```

3. **Update documentation:**
   - Add entry to `DEPENDENCIES.md` under appropriate section
   - If pinning version, add to `.ncurc.json` reject list and document why

4. **Test thoroughly:**
   ```bash
   npm run build-and-test
   ```

### When Upgrading Dependencies

1. **Use upgrade script:**
   ```bash
   npm run upgrade-deps   # Automated upgrade with testing (use cautiously)
   ```

2. **Check rejected packages:**
   - Review `.ncurc.json` reject list
   - Verify if any can be safely upgraded now
   - Update `DEPENDENCIES.md` if upgrading previously-pinned packages

3. **Test extensively:**
   - Run full test suite: `npm run build-and-test`
   - Test example files in browser: `example/live_w_locator.html`
   - Check Cypress tests: `npm run cypress:run`

### When Removing Dependencies

1. **Verify it's unused:**
   ```bash
   grep -r "from 'package-name'" src/
   grep -r 'from "package-name"' src/
   grep -r "require('package-name')" src/
   ```

2. **Check transitive usage:**
   ```bash
   npm ls package-name  # See if other packages depend on it
   ```

3. **Update documentation:**
   - Remove from `DEPENDENCIES.md`
   - Remove from `.ncurc.json` if it was pinned
   - Update bundle size table if it was a runtime dependency

## Code Style Guidelines

### TypeScript

- **Avoid `as any`** - Use specific type assertions like `as Uint8ClampedArray<ArrayBuffer>`
- **Use proper generics** - ArrayBuffer generics required for TS 5.x compatibility
- **Document complex types** - Add JSDoc comments for non-obvious type casts

### Imports

- **Prefer ES modules** - Use `import` not `require()` in new code
- **Tree-shakeable imports** - Use `import merge from 'lodash/merge'` not `import { merge } from 'lodash'`
- **Type-only imports** - Use `import type` when importing only types

### File Organization

- **Tests colocated** - Test files live in `src/**/test/` next to code being tested
- **Type definitions** - Global types in `src/global.d.ts`, package types in `src/vendor.d.ts`
- **Config files** - Build configs in `configs/`, not root directory

## Testing Requirements

### Running Tests

- **Type checking**: `npm run check-types`
- **Linting**: `npm run lint`
- **Unit tests**: `npm run test:node`
- **Browser tests**: `npm run cypress:run`
- **Full suite**: `npm run build-and-test`

### Coverage

- Coverage reports go to `coverage/` directory
- Aim for coverage of new code, but historical coverage is incomplete
- Use `npm run coverage` to generate HTML report

### Test Patterns

- Use `describe()` and `it()` from Mocha
- Use `expect()` from Chai (CommonJS style, not ESM)
- Use `sinon` for mocks/stubs/spies
- Cypress tests in `cypress/e2e/` for browser integration tests

## Common Pitfalls

### Build Issues

1. **"Cannot find module" errors** - Check if dependency is in `devDependencies` and installed
2. **Webpack out of memory** - Use `NODE_OPTIONS=--max-old-space-size=4096`
3. **Babel transpilation errors** - Check if new package needs to be added to babel-loader include list in `configs/webpack.config.js`

### Type Errors

1. **ArrayBuffer compatibility** - TS 5.x requires `Uint8Array<ArrayBuffer>` not `Uint8Array<ArrayBufferLike>`
2. **vec2.clone() return type** - Returns `vec2` (Float32Array) but may need cast to `number[]` for certain APIs
3. **Module augmentation** - Global type extensions go in `src/global.d.ts`

### Dependency Issues

1. **form-data vulnerability** - Fixed via `overrides` in package.json, don't downgrade `@cypress/request`
2. **sinon@21 requires transpilation** - Must include `@sinonjs` in babel-loader (see `configs/webpack.config.js`)
3. **chai@5+ is ESM-only** - Blocked by `.ncurc.json`, would require mocha upgrade first

## Security

### Checking for Vulnerabilities

```bash
npm audit
npm audit fix  # Use cautiously, may break things
```

### Applying Security Fixes

1. **Prefer overrides** - Use `package.json` → `overrides` field for transitive dependencies
2. **Document in DEPENDENCIES.md** - Add entry under "Overrides" section
3. **Test thoroughly** - Security fixes can introduce breaking changes

### Known Issues

- `@babel/polyfill` is deprecated (document in DEPENDENCIES.md if not removed yet)
- Old `mocha@5` may have unpatched vulnerabilities (upgrade blocked by compatibility)
- `webpack@4` no longer receives updates (v5 migration planned)

## Git Workflow

### Branching

- `master` - Stable production branch
- `dev` - Active development branch that primary author uses
- Feature branches - Branch from `master`, PR back to `master`

### Commits

- Write clear commit messages describing what changed and why
- Reference issue numbers: "fix #123: description"
- Breaking changes should be clearly marked

### Before Pushing

```bash
npm run check-types  # TypeScript compilation
npm run lint         # ESLint checks
npm run build-and-test         # Run tests
```

## Publishing Checklist

When preparing a release:

1. **Update version** in `package.json`
2. **Update `DEPENDENCIES.md`** - Verify "Last updated" date
3. **Run full test suite** - `npm run build-and-test`
4. **Check bundle sizes** - Compare `dist/` file sizes to previous version
5. **Test examples** - Manually verify example HTML files work
6. **Build all targets**:
   ```bash
   npm run build:dev
   npm run build:prod
   npm run build:node
   ```
7. **Git tag** - Tag with version number (use format 1.2.3, NOT v1.2.3, old maintainer used "v" prefix)
8. **Publish** - publishing is handled by https://rollingversions.com/ericblade/quagga2 Rolling Versions, do not run `npm publish` manually.  If running on author's machine, you may open a browser to Rolling Versions to trigger the publish.

## Resources

- **TypeScript Docs**: https://www.typescriptlang.org/docs/
- **Webpack 4 Docs**: https://v4.webpack.js.org/
- **Babel Docs**: https://babeljs.io/docs/
- **Issue Tracker**: https://github.com/ericblade/quagga2/issues
- **Original Quagga**: https://github.com/serratus/quaggaJS (archived)

---

**Last Updated**: 2025-11-16

**Note to Copilot**: When suggesting changes, always consider the impact on `DEPENDENCIES.md` and whether it needs updates. This project has complex dependency management due to bundling, version pinning, and security overrides - treat dependency changes with extra care.
