# Explanation

Background knowledge and context about Quagga2. These articles explain *why* things work the way they do, providing deeper understanding beyond just how to use the library.

## Algorithm & Theory

### [How Barcode Localization Works](how-barcode-localization-works.md) ⭐ Featured

Deep dive into the computer vision algorithms that find barcodes in images. Covers:

- Binary image creation with Otsu's method
- Skeletonization
- Component labeling
- Orientation detection using image moments
- Why this approach is rotation/scale invariant

**Read this if**: You want to understand the "magic" behind barcode detection, optimize performance, or contribute to the localization code.

## Architecture

### [How Input Streams Work](input-streams.md)

Technical deep dive into the three input stream types and their initialization flow. Covers:

- LiveStream, VideoStream, and ImageStream differences
- The async initialization sequence
- Why `framegrabber` indicates init completion
- Race conditions and how to avoid them

**Read this if**: You're debugging initialization issues, dealing with React StrictMode, or want to understand the media pipeline.

### [Algorithm Overview](algorithm-overview.md) *(Coming Soon)*

High-level overview of Quagga2's processing pipeline from input to output.

### [Code Architecture](architecture.md)

Structure of the codebase, module organization, and design decisions.

## Concepts

### [Why asm.js for Skeletonization](why-asmjs.md) *(Coming Soon)*

Explanation of why performance-critical code uses asm.js and what that means.

### [Reader Design Patterns](reader-patterns.md) *(Coming Soon)*

How barcode readers are implemented and how to create custom ones.

## Differences from Other Doc Types

**Explanation** articles:

- Provide context and background
- Discuss alternatives and trade-offs
- Explain historical decisions
- Connect concepts together
- Are OK to read casually

**Tutorials**: Step-by-step learning by doing
**How-To Guides**: Task-focused, get things done
**Reference**: Precise technical specifications

## When to Read Explanations

Read these articles when you:

- Want to **understand** how things work under the hood
- Need to **debug** complex issues
- Want to **contribute** to the codebase
- Are **curious** about design decisions
- Want to **optimize** beyond basic tuning

## Contributing

Have insights to share about how Quagga2 works? We welcome explanation articles! See the [Contributing Guide](../contributing.md).

---

[← Back to Documentation Home](../index.md)
