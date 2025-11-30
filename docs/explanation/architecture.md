# Architecture {#architecture}

This page describes Quagga2's code structure and design decisions.

## Project Structure {#project-structure}

```
quagga2/
├── src/
│   ├── quagga.ts           # Main entry point
│   ├── config/             # Configuration handling
│   ├── decoder/            # Barcode decoding
│   │   ├── barcode_decoder.ts
│   │   └── readers/        # Individual barcode readers
│   ├── locator/            # Barcode localization
│   │   ├── barcode_locator.ts
│   │   └── skeletonizer.ts
│   ├── input/              # Input handling
│   │   ├── camera_access.ts
│   │   └── frame_grabber.ts
│   └── common/             # Shared utilities
│       ├── cv_utils.ts     # Computer vision utilities
│       └── image_wrapper.ts
├── dist/                   # Browser builds
├── lib/                    # Node.js build
└── type-definitions/       # TypeScript types
```

## Core Components {#core-components}

### Quagga (Main API) {#main-api}

The main entry point (`src/quagga.ts`) exposes the public API:

- `init()` / `start()` / `stop()`
- `decodeSingle()`
- `onDetected()` / `onProcessed()`
- `CameraAccess` namespace

### Barcode Locator {#barcode-locator}

Located in `src/locator/`, responsible for finding barcode regions in images:

- **barcode_locator.ts**: Main localization logic
- **skeletonizer.ts**: Line structure extraction (asm.js optimized)

### Barcode Decoder {#barcode-decoder}

Located in `src/decoder/`, handles barcode decoding:

- **barcode_decoder.ts**: Coordinates decoding process
- **readers/**: Individual reader implementations
  - Each reader extends `BarcodeReader` base class
  - Implements format-specific pattern matching

### Input Handling {#input-handling}

Located in `src/input/`:

- **camera_access.ts**: Camera enumeration and control
- **frame_grabber_browser.ts**: Browser frame capture
- **frame_grabber_node.ts**: Node.js image loading

## Data Flow {#data-flow}

```
Camera/Image
    ↓
FrameGrabber (captures frame)
    ↓
ImageWrapper (grayscale conversion)
    ↓
BarcodeLocator (finds barcode region)
    ↓
BarcodeDecoder (decodes barcode)
    ↓
Result callbacks
```

## Design Decisions {#design-decisions}

### Bundle Everything {#bundle-everything}

All dependencies are bundled into the final build. This means:

- Consumers never install dependencies directly
- All packages go in `devDependencies`
- Builds are self-contained

### Dual Build Targets {#dual-build-targets}

- **Browser**: `dist/quagga.min.js` - UMD bundle
- **Node.js**: `lib/quagga.js` - CommonJS module

### Reader Architecture {#reader-architecture}

Readers are pluggable:

- Built-in readers in `src/decoder/readers/`
- External readers via `Quagga.registerReader()`
- All readers extend common `BarcodeReader` class

## Build System {#build-system}

- **Webpack 4**: Module bundling
- **Babel**: ES6+ transpilation
- **TypeScript**: Type checking (but source is mixed JS/TS)

## Related {#related}

- [Algorithm Overview](algorithm-overview.md) - How the algorithms work
- [Create External Readers](../how-to-guides/external-readers.md) - Extend Quagga2
- [Contributing](../contributing.md) - Development setup

---

[← Back to Explanation](index.md)
