# Using Quagga2 in Node.js {#node-usage}

This tutorial covers server-side barcode scanning with Quagga2 in Node.js.

## Installation {#installation}

```bash
npm install @ericblade/quagga2
```

## Basic Usage {#basic-usage}

```javascript
const Quagga = require('@ericblade/quagga2').default;

Quagga.decodeSingle({
  src: './barcode.jpg',
  decoder: {
    readers: ['code_128_reader', 'ean_reader']
  }
}, function(result) {
  if (result && result.codeResult) {
    console.log('Barcode:', result.codeResult.code);
    console.log('Format:', result.codeResult.format);
  } else {
    console.log('No barcode found');
  }
});
```

## With Promises {#with-promises}

Wrap in a Promise for async/await:

```javascript
const Quagga = require('@ericblade/quagga2').default;

function decodeBarcode(imagePath, readers = ['code_128_reader']) {
  return new Promise((resolve, reject) => {
    Quagga.decodeSingle({
      src: imagePath,
      decoder: { readers }
    }, (result) => {
      if (result && result.codeResult) {
        resolve(result.codeResult);
      } else {
        resolve(null);
      }
    });
  });
}

// Usage
async function main() {
  const result = await decodeBarcode('./barcode.jpg');
  if (result) {
    console.log(`Found ${result.format}: ${result.code}`);
  }
}

main();
```

## Express API Example {#express-example}

```javascript
const express = require('express');
const multer = require('multer');
const Quagga = require('@ericblade/quagga2').default;

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/scan', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  Quagga.decodeSingle({
    src: req.file.path,
    decoder: {
      readers: ['code_128_reader', 'ean_reader', 'upc_reader']
    }
  }, (result) => {
    if (result && result.codeResult) {
      res.json({
        code: result.codeResult.code,
        format: result.codeResult.format
      });
    } else {
      res.json({ code: null, error: 'No barcode found' });
    }
  });
});

app.listen(3000, () => {
  console.log('Barcode API running on port 3000');
});
```

## Batch Processing {#batch-processing}

Process multiple images:

```javascript
const Quagga = require('@ericblade/quagga2').default;
const fs = require('fs');
const path = require('path');

async function decodeImage(imagePath) {
  return new Promise((resolve) => {
    Quagga.decodeSingle({
      src: imagePath,
      decoder: { readers: ['code_128_reader', 'ean_reader'] }
    }, (result) => {
      resolve({
        file: path.basename(imagePath),
        code: result?.codeResult?.code || null,
        format: result?.codeResult?.format || null
      });
    });
  });
}

async function processDirectory(dir) {
  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  
  const results = [];
  for (const file of files) {
    const result = await decodeImage(path.join(dir, file));
    results.push(result);
    console.log(`${result.file}: ${result.code || 'No barcode'}`);
  }
  
  return results;
}

processDirectory('./images');
```

## Configuration Tips {#configuration-tips}

### Image Size {#image-size}

Control processing resolution:

```javascript
Quagga.decodeSingle({
  src: './large-image.jpg',
  inputStream: {
    size: 1280  // Scale to max 1280px
  },
  decoder: { readers: ['ean_reader'] }
}, callback);
```

### Locator Settings {#locator-settings}

For difficult images:

```javascript
Quagga.decodeSingle({
  src: './image.jpg',
  locate: true,
  locator: {
    patchSize: 'small',
    halfSample: false
  },
  decoder: { readers: ['code_128_reader'] }
}, callback);
```

## Related {#related}

- [Static Image Scanning](static-image.md) - Browser-side image decoding
- [API Reference](../reference/api.md#quagga-decodesingle) - `decodeSingle()` details
- [Configuration Reference](../reference/configuration.md) - All options

---

[← Back to Tutorials](index.md)
