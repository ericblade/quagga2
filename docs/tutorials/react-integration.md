# Using Quagga2 with React {#react-integration}

This tutorial shows how to integrate Quagga2 into a React application.

## Installation {#installation}

```bash
npm install @ericblade/quagga2
```

## Basic Component {#basic-component}

```jsx
import React, { useEffect, useRef, useCallback } from 'react';
import Quagga from '@ericblade/quagga2';

function BarcodeScanner({ onDetected }) {
  const scannerRef = useRef(null);

  const handleDetected = useCallback((result) => {
    if (result.codeResult) {
      onDetected(result.codeResult.code);
    }
  }, [onDetected]);

  useEffect(() => {
    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: scannerRef.current,
        constraints: {
          facingMode: 'environment'
        }
      },
      decoder: {
        readers: ['code_128_reader', 'ean_reader']
      }
    }, (err) => {
      if (err) {
        console.error('Failed to initialize:', err);
        return;
      }
      Quagga.start();
    });

    Quagga.onDetected(handleDetected);

    return () => {
      Quagga.offDetected(handleDetected);
      Quagga.stop();
    };
  }, [handleDetected]);

  return <div ref={scannerRef} style={{ width: '100%' }} />;
}

export default BarcodeScanner;
```

## Usage {#usage}

```jsx
import BarcodeScanner from './BarcodeScanner';

function App() {
  const handleScan = (code) => {
    console.log('Scanned:', code);
    alert(`Barcode: ${code}`);
  };

  return (
    <div>
      <h1>Scan a Barcode</h1>
      <BarcodeScanner onDetected={handleScan} />
    </div>
  );
}
```

## With Hooks {#with-hooks}

Create a reusable hook:

```jsx
import { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';

export function useQuagga(config = {}) {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: scannerRef.current,
        ...config.inputStream
      },
      decoder: {
        readers: ['code_128_reader'],
        ...config.decoder
      },
      ...config
    }, (err) => {
      if (!err) {
        Quagga.start();
        setScanning(true);
      }
    });

    Quagga.onDetected((data) => {
      setResult(data.codeResult);
    });

    return () => {
      Quagga.stop();
      setScanning(false);
    };
  }, []);

  return { scannerRef, scanning, result };
}
```

## Stop on Detection {#stop-on-detection}

```jsx
function SingleScanComponent({ onComplete }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: scannerRef.current
      },
      decoder: {
        readers: ['ean_reader']
      }
    }, (err) => {
      if (!err) Quagga.start();
    });

    const handleDetected = (result) => {
      Quagga.stop();
      onComplete(result.codeResult.code);
    };

    Quagga.onDetected(handleDetected);

    return () => {
      Quagga.offDetected(handleDetected);
      Quagga.stop();
    };
  }, [onComplete]);

  return <div ref={scannerRef} />;
}
```

## Resources {#resources}

- [quagga2-react-example](https://github.com/ericblade/quagga2-react-example/) - Complete example
- [quagga2-redux-middleware](https://github.com/ericblade/quagga2-redux-middleware/) - Redux integration

## Related {#related}

- [API Reference](../reference/api.md) - Full API documentation
- [Configuration Reference](../reference/configuration.md) - All options

---

[← Back to Tutorials](index.md)
