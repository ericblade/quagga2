# Quagga2 Documentation


Welcome to the Quagga2 documentation! Quagga2 is a JavaScript barcode scanner library supporting real-time location (localization) and decoding of various barcode types in both browser and Node.js environments.

![Badge](https://hitscounter.dev/api/hit?url=https%3A%2F%2Fericblade.github.io%2Fquagga2%2F&label=Views+%28Today%2FTotal%29&icon=link&color=%23198754&message=&style=plastic&tz=US%2FEastern)
[![Join the chat at https://gitter.im/quaggaJS/Lobby](https://badges.gitter.im/quaggaJS/Lobby.svg)](https://gitter.im/quaggaJS/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Quick Links

- [GitHub Repository](https://github.com/ericblade/quagga2)
- [Changelog](https://github.com/ericblade/quagga2/releases)
- [npm Package](https://www.npmjs.com/package/@ericblade/quagga2)
- [Live Examples](examples/)

## Getting Started

New to Quagga2? Start here:

- **[Installation & Quick Start](getting-started.md)** - Get up and running in minutes

---

## Documentation Structure

This documentation follows the [Divio Documentation System](https://documentation.divio.com/), organizing content into four types based on what you need:

### 📚 [Tutorials](tutorials/) - *Learning-oriented*

Step-by-step lessons to help you learn by doing. Perfect if you're just getting started.

- [Your First Barcode Scan](tutorials/first-scan.md) - Scan barcodes with your camera
- [Decoding Static Images](tutorials/static-image.md) - Process image files
- [Using with React](tutorials/react-integration.md) - React integration guide
- [Using with Node.js](tutorials/node-usage.md) - Server-side barcode scanning

### 🛠️ [How-To Guides](how-to-guides/) - *Task-oriented*

Practical guides for accomplishing specific goals. Use these when you have a problem to solve.

- [Configure Barcode Readers](how-to-guides/configure-readers.md) - Select which barcode types to scan
- [Optimize Performance](how-to-guides/optimize-performance.md) - Improve speed and accuracy
- [Handle Difficult Barcodes](how-to-guides/handle-difficult-barcodes.md) - Deal with poor lighting, rotation, etc.
- [Use Debug Flags](how-to-guides/use-debug-flags.md) - Enable diagnostic output
- [Create External Readers](how-to-guides/external-readers.md) - Build custom barcode decoder plugins

### 📖 [Reference](reference/) - *Information-oriented*

Technical descriptions and API documentation. Look here when you need precise details.

- [API Documentation](reference/api.md) - Complete API reference
- [Configuration Options](reference/configuration.md) - All config parameters explained
- [Camera Access API](reference/camera-access.md) - Camera control methods
- [Supported Barcode Types](reference/readers.md) - Available decoders
- [Browser Support](reference/browser-support.md) - Compatibility information
- [Dependencies](reference/dependencies.md) - Package dependencies explained

### 💡 [Explanation](explanation/) - *Understanding-oriented*

Background, context, and deeper understanding. Read these to learn *why* things work the way they do.

- [How Barcode Localization Works](explanation/how-barcode-localization-works.md) - The algorithm behind barcode detection
- [Algorithm Overview](explanation/algorithm-overview.md) - Image processing pipeline
- [Architecture](explanation/architecture.md) - Code structure and design decisions

---

## Additional Resources

- [Contributing Guide](contributing.md) - How to contribute to Quagga2
- [Gitter Chat](https://gitter.im/quaggaJS/Lobby) - Ask questions and get help

---

## Framework Integration

Using Quagga2 with a specific framework?

- **React**: [quagga2-react-example](https://github.com/ericblade/quagga2-react-example/) and [quagga2-redux-middleware](https://github.com/ericblade/quagga2-redux-middleware/)
- **Angular**: [ngx-barcode-scanner](https://github.com/julienboulay/ngx-barcode-scanner) or [mobile-scanning-demo](https://github.com/classycodeoss/mobile-scanning-demo)
- **Vue 2**: [vue-quagga-2](https://github.com/DevinNorgarb/vue-quagga-2)
- **Vue 3**: [vue3-quagga-2](https://github.com/nick-0101/vue3-quagga-2)
- **ThingWorx**: [ThingworxBarcodeScannerWidget](https://github.com/ptc-iot-sharing/ThingworxBarcodeScannerWidget)

---

## External Readers and Other Related Projects {#external-readers}

- **DataMatrix Reader**: [hackathi/quagga2-reader-datamatrix](https://github.com/hackathi/quagga2-reader-datamatrix)
- **QR Code Reader**: [ericblade/quagga2-qr-code-reader](https://github.com/ericblade/quagga2-qr-code-reader)
- **PDFBarcodeJS**: [rexshijaku/PDFBarcodeJS](https://github.com/rexshijaku/PDFBarcodeJS)

---

## Who Uses Quagga2? {#who-uses}
Quagga2 is used by developers worldwide in various applications, including inventory management, retail point-of-sale systems, library systems, and mobile scanning apps. If you're using Quagga2 in your project, let us know!

- **Internet Archive Open Library**: [internetarchive/openlibrary](https://github.com/internetarchive/openlibrary)
- **Grocy**: [grocy/grocy](https://github.com/grocy/grocy)
- **German Federal Agency For Technical Relief**: [mziech/thw-inventory](https://github.com/mziech/thw-inventory)
- **Food Coop Shop**: [foodcoopshop/foodcoopshop](https://github.com/foodcoopshop/foodcoopshop)
- **Rintagi**: [Rintagi/Low-Code-Development-Platform](https://github.com/Rintagi/Low-Code-Development-Platform)
- **LINE**: [line/line-api-use-case-smart-retail](https://github.com/line/line-api-use-case-smart-retail)
- **Veganify**: [frontendnetwork/veganify](https://github.com/frontendnetwork/veganify)
- **Appsemble**: [Appsemble](https://gitlab.com/appsemble/appsemble)
- **Intake24**: [intake24/intake24](https://github.com/intake24/intake24)
- **FridgeToPlate**: [COS301-SE-2023/FridgeToPlate](https://github.com/COS301-SE-2023/FridgeToPlate)
- **Nutri-Scanner**: [kishan9535/Nutri-Scanner](https://github.com/kishan9535/Nutri-Scanner)
- **Musclog**: [blopa/musclog-app](https://github.com/blopa/musclog-app)


---

## About This Documentation

This documentation is maintained alongside the Quagga2 codebase. If you find errors or have suggestions for improvement, please [open an issue](https://github.com/ericblade/quagga2/issues) or submit a pull request.

**Last Updated**: November 2025
