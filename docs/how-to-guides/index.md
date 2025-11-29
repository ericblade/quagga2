# How-To Guides

Task-oriented guides for solving specific problems with Quagga2. These assume you have basic familiarity with the library and focus on getting things done.

## Configuration & Setup

### [Configure Barcode Readers](configure-readers.md)

Select which barcode formats to scan (EAN, CODE 128, UPC, etc.) and understand the trade-offs.

### [Use Debug Flags](use-debug-flags.md) 🆕

Enable diagnostic output to troubleshoot issues with localization, decoding, or camera setup.

## Performance & Quality

### [Optimize Performance](optimize-performance.md)

Improve scanning speed and reduce CPU usage through configuration tuning.

### [Handle Difficult Barcodes](handle-difficult-barcodes.md)

Techniques for decoding barcodes with poor lighting, damage, rotation, or small size.

## Advanced Features

### [Create External Readers](external-readers.md)

Build custom barcode decoder plugins to support additional formats.

## Camera & Input

### [Select Specific Camera](select-camera.md) *(Coming Soon)*

Choose between front/back cameras on mobile devices or select from multiple USB cameras.

### [Adjust Camera Settings](camera-settings.md) *(Coming Soon)*

Control focus, zoom, flash/torch, and other camera parameters.

## Drawing & Visualization

### [Working with Box Coordinates](working-with-coordinates.md) 🆕

Understand how `box`, `boxes`, and `line` coordinates relate to processed vs. original image dimensions, and how to properly scale coordinates for overlay rendering on video elements.

## Tips & Best Practices

### [Tips and Tricks](tips-and-tricks.md)

Practical advice for getting the best results with Quagga2, including camera setup, user experience, and handling results.

## Integration

### [Handle Multiple Barcodes](multiple-barcodes.md) *(Coming Soon)*

Detect and decode several barcodes in a single frame simultaneously.

### [Scan in Background](background-scanning.md) *(Coming Soon)*

Continue scanning while users interact with other UI elements.

## Differences from Tutorials

**Tutorials** are for learning - they're comprehensive, beginner-friendly, and explain *why* you're doing each step.

**How-To Guides** are for doing - they're focused, assume knowledge, and show *how* to accomplish specific goals.

If you're new to Quagga2, start with [Tutorials](../tutorials/) instead.

## Contributing

Have a useful technique or solution to share? We welcome contributions! See the [Contributing Guide](../contributing.md).

---

[← Back to Documentation Home](../index.md)
