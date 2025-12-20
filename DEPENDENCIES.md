# Quagga2 Dependencies

This document explains the dependency structure of Quagga2 and clarifies which packages are runtime code dependencies versus build/test tools.

## Background

Quagga2 bundles all its code with Webpack, producing standalone browser and Node.js builds. As a result, **all packages are listed as `devDependencies`** in `package.json` because consumers never directly install them - they only use the pre-built bundles in `dist/` and `lib/`.

However, this makes it unclear which packages are actual code dependencies (bundled into the final output) versus which are just build/test tools. This document clarifies that distinction.

---

## Runtime Code Dependencies

These packages contain code that is **imported by the source code** and **bundled into the final output**:

### Core Libraries

- **`gl-matrix`** (^3.4.4)
  - **Purpose**: High-performance vector and matrix math operations
  - **Usage**: Used throughout the codebase for geometric calculations
  - **Location**: Listed in `dependencies` (not `devDependencies`) - see [Type Definition Dependencies](#type-definition-dependencies) below
  - **Files**:
    - `src/quagga/quagga.ts` - vec2 operations for bounding boxes
    - `src/quagga/initBuffers.ts` - vec2 for buffer initialization
    - `src/locator/barcode_locator.js` - vec2, mat2 for barcode location
    - `src/common/image_wrapper.ts` - vec2 for image transforms
    - `src/common/cvutils/ImageRef.ts` - vec2, vec3 for computer vision
    - `src/common/cluster.js` - vec2 for clustering algorithms
    - `type-definitions/quagga.d.ts` - vec2 type import for `Moment.vec` property

- **`lodash`** (^4.17.21)
  - **Purpose**: Utility functions for object manipulation
  - **Usage**: Primarily `merge()` for config merging, `pick()` for object selection
  - **Files**:
    - `src/quagga.js` - merge() for configuration
    - `src/QuaggaStatic.ts` - merge() for configuration
    - `src/reader/ean_reader.ts` - merge() for config defaults
    - `src/reader/i2of5_reader.ts` - merge() for config defaults
    - `src/input/camera_access.ts` - pick() for MediaTrackConstraints
    - `src/locator/test/barcode_locator.spec.ts` - merge() in tests

### Image Processing

- **`ndarray`** (^1.0.19)
  - **Purpose**: N-dimensional array manipulation
  - **Usage**: Core data structure for image data processing
  - **Files**:
    - `src/input/input_stream/input_stream_base.ts` - NdArray type definitions
    - `src/input/input_stream/input_stream.ts` - NdArray for frame data
    - `src/input/frame_grabber.ts` - Ndarray for frame manipulation
    - `src/vendor.d.ts` - Type definitions

- **`ndarray-linear-interpolate`** (^1.0.0)
  - **Purpose**: Bilinear interpolation for ndarray data
  - **Usage**: Image scaling and transformations
  - **Files**:
    - `src/input/frame_grabber.ts` - `d2()` method for 2D interpolation

- **`ndarray-pixels`** (^5.0.1)
  - **Purpose**: Convert between image formats and ndarray
  - **Usage**: Loading image data from various sources
  - **Files**:
    - `src/input/input_stream/input_stream.ts` - `getPixels()` for image loading

### Polyfills (Deprecated)

- **`@babel/polyfill`** (^7.12.1)
  - **Status**: ⚠️ **DEPRECATED** by Babel team
  - **Purpose**: Legacy polyfill for ES6+ features
  - **Current Usage**: Not directly imported in source code
  - **Recommendation**: Should be removed in favor of `core-js` + `regenerator-runtime` or Babel's automatic polyfill injection
  - **Migration Path**: Use `@babel/preset-env` with `useBuiltIns: 'usage'` and explicit `core-js@3`

---

## Build & Development Tools

These packages are **only used during build/development** and are **not bundled into the final output**:

### TypeScript Toolchain

- **`typescript`** (^5.9.3) - TypeScript compiler
- **`@types/*`** packages - Type definitions for TypeScript
  - `@types/chai`, `@types/gl-vec2`, `@types/lodash`, `@types/mocha`, `@types/node`, `@types/sinon`, `@types/sinon-chai`

### Webpack & Bundling

- **`webpack`** (^4.44.2) - Module bundler (used to create `dist/` and `lib/` outputs)
- **`webpack-cli`** (^3.3.12) - Webpack command-line interface
- **`babel-loader`** (^8.2.5) - Webpack loader for Babel transpilation
- **`source-map-loader`** (^1.1.1) - Webpack loader for source maps

### Babel Transpilation

- **`@babel/core`** (^7.28.5) - Babel compiler core
- **`@babel/preset-env`** (^7.28.5) - Smart transpilation based on target environments
- **`@babel/preset-typescript`** (^7.28.5) - TypeScript support in Babel
- **`@babel/plugin-*`** - Various syntax plugins:
  - `@babel/plugin-proposal-class-properties`
  - `@babel/plugin-proposal-nullish-coalescing-operator`
  - `@babel/plugin-proposal-object-rest-spread`
  - `@babel/plugin-proposal-optional-chaining`
  - `@babel/plugin-transform-runtime`
- **`@babel/runtime`** (^7.28.4) - Babel runtime helpers
- **`babel-plugin-add-module-exports`** (^1.0.4) - CommonJS module.exports handling
- **`babel-plugin-istanbul`** (^7.0.1) - Code coverage instrumentation

### Testing

- **`mocha`** (^5.2.0) - Test framework
- **`chai`** (^4.3.10) - Assertion library
- **`sinon`** (^21.0.0) - Test spies, stubs, and mocks
- **`sinon-chai`** (^3.7.0) - Sinon assertions for Chai
- **`ts-mocha`** (^11.1.0) - TypeScript support for Mocha
- **`ts-node`** (^10.9.2) - TypeScript execution for Node.js
- **`cypress`** (^13.17.0) - End-to-end browser testing
- **`@cypress/webpack-preprocessor`** (6.0.0) - Webpack integration for Cypress
- **`@cypress/code-coverage`** (^3.12.4) - Code coverage for Cypress tests
- **`nyc`** (^17.1.0) - Code coverage tool (Istanbul wrapper)

### Linting & Code Quality

- **`eslint`** (^8.57.1) - JavaScript/TypeScript linter
- **`@typescript-eslint/eslint-plugin`** (^7.18.0) - TypeScript-specific ESLint rules
- **`@typescript-eslint/parser`** (^7.18.0) - TypeScript parser for ESLint
- **`eslint-config-airbnb-base`** (^15.0.0) - Airbnb JavaScript style guide
- **`eslint-config-airbnb-typescript`** (^18.0.0) - Airbnb style for TypeScript
- **`eslint-config-airbnb-typescript-base`** (^6.0.1) - Base Airbnb TypeScript config
- **`eslint-plugin-import`** (^2.32.0) - Import/export validation
- **`eslint-plugin-jsx-a11y`** (^6.10.2) - Accessibility linting
- **`eslint-plugin-typescript-sort-keys`** (^3.3.0) - Enforce sorted object keys

### Utilities

- **`core-js`** (^3.46.0) - Modern JavaScript polyfills (used by Babel)
- **`cross-env`** (^10.1.0) - Cross-platform environment variable setting

---

## Optional Dependencies

- **`fsevents`** (2.3.3)
  - **Platform**: macOS only
  - **Purpose**: Native file watching for better performance
  - **Usage**: Automatically used by Webpack/build tools on macOS

- **`ndarray-pixels`** (^5.0.1)
  - **Platform**: Node.js only
  - **Purpose**: Image decoding for `decodeSingle` in Node.js
  - **Usage**: Required for Node.js `decodeSingle()` support; install with `npm install ndarray-pixels sharp`
  - **Note**: Marked external in Node webpack build; not bundled into `lib/quagga.js`

- **`sharp`** (^0.34.0)
  - **Platform**: Node.js only
  - **Purpose**: Native image processing (used by `ndarray-pixels` on Node.js)
  - **Usage**: Required for Node.js `decodeSingle()` support; transitive dependency of `ndarray-pixels`
  - **Note**: Marked external in Node webpack build; not bundled into `lib/quagga.js`

---

## Overrides

No package overrides are currently needed. Cypress 13.17.0+ uses `@cypress/request@^3.0.6` which includes the security fix for the `form-data` vulnerability (versions >= 3.0.6 use `form-data@~4.0.0` which is safe).

---

## Bundle Size Impact

When evaluating dependencies, consider their impact on bundle size:

| Package | Approximate Size | Bundled? |
|---------|-----------------|----------|
| `gl-matrix` | ~50 KB (minified) | ✅ Yes |
| `lodash` | ~4 KB (only `merge` + `pick`) | ✅ Yes (tree-shaken) |
| `ndarray` | ~5 KB | ✅ Yes |
| `ndarray-linear-interpolate` | ~2 KB | ✅ Yes |
| `ndarray-pixels` | ~10 KB | ✅ Yes (browser) |
| `webpack` | ~1.5 MB | ❌ No (dev only) |
| `typescript` | ~50 MB | ❌ No (dev only) |

---

## Adding New Dependencies

When adding a new dependency, consider:

1. **Is it a runtime dependency?**
   - Will the code be `import`ed in `src/` files?
   - Will it be bundled into `dist/` or `lib/` output?
   - → Add to `devDependencies` (all deps go here due to bundling)
   - → Document it in the "Runtime Code Dependencies" section above

2. **Is it a build/test tool?**
   - Is it only used by Webpack, Babel, ESLint, Mocha, etc.?
   - → Add to `devDependencies`
   - → Document it in the "Build & Development Tools" section above

3. **Bundle size impact?**
   - Run `npm run build` and check the size change in `dist/quagga.min.js`
   - Consider tree-shaking (does the library support ES modules?)
   - Look for lighter alternatives if the package is large

4. **Browser compatibility?**
   - Does the package work in browsers?
   - Does it require Node.js-specific APIs (`fs`, `path`, etc.)?
   - → Check if it's already shimmed in `configs/webpack.config.js` (e.g., `node: { fs: 'empty' }`)

---

## Version Constraints

### Pinned Versions

Some packages are pinned to specific versions due to compatibility issues:

- **`mocha@^5.2.0`** - Pinned to v5 because newer versions have breaking changes
- **`chai@^4.3.10`** - Pinned to v4 because v5+ and v6+ are ESM-only, incompatible with CommonJS tests
- **`sinon-chai@^3.7.0`** - Pinned to match `chai@4.x` compatibility
- **`webpack@^4.44.2`** - Pinned to v4 because v5 requires significant config migration
- **`cypress@^13.17.0`** - Pinned to v13 for stability

These are configured in `.ncurc.json` to prevent accidental upgrades via `npm-check-updates`.

### Upgrade Policy

- **TypeScript ecosystem** (`typescript`, `@typescript-eslint/*`, `ts-*`): Keep up-to-date
- **Babel ecosystem** (`@babel/*`): Keep up-to-date for security and features
- **Testing tools** (`mocha`, `chai`, `sinon`): Upgrade cautiously, test thoroughly
- **Webpack & bundlers**: Major version upgrades require careful migration planning
- **Runtime dependencies** (`gl-matrix`, `lodash`, `ndarray*`): Keep up-to-date unless breaking changes occur

---

## Security Considerations

### Known Issues

1. **`@babel/polyfill` is deprecated** - Should migrate to `core-js@3` + `regenerator-runtime`
2. **Old `mocha` version** - v5.2.0 is from 2018, may have unpatched vulnerabilities
3. **Webpack 4** - No longer receives updates, consider upgrading to Webpack 5

### Monitoring

- Run `npm audit` regularly to check for vulnerabilities
- Use `npm run check-updates` to see available updates
- Check GitHub Dependabot alerts

---

## Type Definition Dependencies

### Exception: `gl-matrix` in `dependencies`

While most packages in Quagga2 are listed in `devDependencies` because they are bundled (see [Background](#background)), **`gl-matrix` is an exception** and is listed in `dependencies`.

**Why?**

The TypeScript type definition file (`type-definitions/quagga.d.ts`) imports `vec2` from `gl-matrix`:

```typescript
import { vec2 } from 'gl-matrix';
```

This type is used in the `Moment` interface:

```typescript
export type Moment = {
    // ... other properties
    vec?: vec2;
};
```

When TypeScript consumers use Quagga2 with type checking, the TypeScript compiler needs to resolve this import to provide proper type information. If `gl-matrix` were in `devDependencies`, it would not be installed when consumers run `npm install @ericblade/quagga2`, causing TypeScript compilation errors.

**Key distinction:**

- **Runtime bundling**: `gl-matrix` code IS bundled into `dist/quagga.min.js` - consumers don't need it at runtime
- **Type resolution**: TypeScript consumers DO need `gl-matrix` installed to resolve types in `quagga.d.ts`

This is a special case where type definitions create a true development-time dependency for consumers using TypeScript.

---

## FAQ

**Q: Why are runtime dependencies in `devDependencies` instead of `dependencies`?**

A: Quagga2 is a **bundled library**. Consumers install the package and use the pre-built files (`dist/quagga.min.js` or `lib/quagga.js`), not the source code. They never run `npm install` on Quagga2's dependencies. Therefore, from npm's perspective, all packages are development dependencies (used during build), not runtime dependencies (used after install).

**Q: Why is `gl-matrix` in `dependencies` if everything else is in `devDependencies`?**

A: This is an exception for TypeScript type resolution. The type definition file (`type-definitions/quagga.d.ts`) imports `vec2` from `gl-matrix` to provide proper typing for the `Moment.vec` property. TypeScript consumers need `gl-matrix` installed to resolve these types during compilation. See [Type Definition Dependencies](#type-definition-dependencies) for details.

**Q: How can I tell if a package is actually used in the code?**

A: Search the `src/` directory:
```bash
# Search for imports
grep -r "from 'package-name'" src/
grep -r 'from "package-name"' src/
grep -r "require('package-name')" src/
```

**Q: What's the difference between `optionalDependencies` and `devDependencies`?**

A: `optionalDependencies` are packages that enhance functionality if available but aren't required (like `fsevents` for macOS file watching). `devDependencies` are required for development but not for using the published package.

**Q: Can I remove `@babel/polyfill`?**

A: Yes, but carefully. It's deprecated and not directly imported anymore. Remove it from `package.json` and verify that `@babel/preset-env` is configured to polyfill features automatically via `core-js@3`. Test thoroughly in older browsers (IE11, older Safari) after removal.

**Q: Why can't I upgrade `chai` to version 5 or 6?**

A: `chai@5+` and `chai@6+` are ESM-only (ES modules). Quagga2's tests use CommonJS (`require()`), and `mocha@5` doesn't support ESM. Upgrading `chai` requires also upgrading `mocha` to v9.1.0+ and migrating all test files to ESM syntax.

---

## Related Files

- **`package.json`** - Dependency declarations
- **`.ncurc.json`** - npm-check-updates configuration (blocks unsafe auto-upgrades)
- **`configs/webpack.config.js`** - Build configuration showing which dependencies are bundled
- **`configs/webpack.node.config.js`** - Node.js-specific build configuration
- **`CHANGELOG.md`** - Version history and dependency changes

---

## Maintenance Notes

This document was created in November 2025 following the TypeScript 5.9.3 upgrade. It should be updated whenever:

- A new dependency is added or removed
- A major version upgrade changes behavior
- Security vulnerabilities are discovered and patched
- Build tooling changes significantly

Last updated: 2025-12-01
