import { expect } from 'chai';
import Quagga from '../../../quagga';

// Utility to build a base config for browser decodeSingle
function baseConfig() {
  return {
    inputStream: {
      type: 'ImageStream',
      size: 640,
      // sequence disabled; single image
    },
    locator: {
      patchSize: 'medium',
      halfSample: false,
    },
    numOfWorkers: 0,
    decoder: {
      readers: ['code_128_reader'],
    },
    locate: true,
    src: '/test/fixtures/code_128/image-001.jpg',
  } as any;
}

describe('FrameGrabber Browser inputStream.halfSample', () => {
  function canvasMeanRGBA(canvas?: HTMLCanvasElement | null) {
    if (!canvas) return { r: 0, g: 0, b: 0, a: 0 };
    const ctx = canvas.getContext('2d');
    if (!ctx) return { r: 0, g: 0, b: 0, a: 0 };
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h).data;
    let r = 0, g = 0, b = 0, a = 0;
    for (let i = 0; i < img.length; i += 4) {
      r += img[i];
      g += img[i + 1];
      b += img[i + 2];
      a += img[i + 3];
    }
    const count = img.length / 4;
    return { r: r / count, g: g / count, b: b / count, a: a / count };
  }

  it('captures decode result and optional canvas with inputStream.halfSample=false', async function() {
    this.timeout(10000);
    const config = baseConfig();
    // Explicitly ensure inputStream.halfSample is false
    (config as any).inputStream.halfSample = false;
    const result = await Quagga.decodeSingle(config as any);
    expect(result, 'expect decode to succeed without halfSample at acquisition').to.be.an('Object');
    expect(Quagga.canvas).to.be.an('Object');
    expect(Quagga.canvas.dom).to.be.an('Object');
    expect(Quagga.canvas.ctx).to.be.an('Object');
    const imgCanvas = (Quagga.canvas.dom && (Quagga.canvas.dom as any).image) || (Quagga.canvas.ctx && (Quagga.canvas.ctx as any).image && (Quagga.canvas.ctx as any).image.canvas) || null;
    const overlayCanvas = (Quagga.canvas.dom && (Quagga.canvas.dom as any).overlay) || (Quagga.canvas.ctx && (Quagga.canvas.ctx as any).overlay && (Quagga.canvas.ctx as any).overlay.canvas) || null;
    const docCanvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    const chosen = (imgCanvas || overlayCanvas || docCanvas) as HTMLCanvasElement | null;
    const mean = canvasMeanRGBA(chosen);
    // Store on window for comparison in next test
    (window as any).__mean_no_halfsample = mean;
  });

  it('captures decode result and optional canvas with inputStream.halfSample=true', async function() {
    this.timeout(10000);
    const config = baseConfig();
    // Toggle inputStream.halfSample to true to exercise half-sample path in browser grabber
    (config as any).inputStream.halfSample = true;
    const result = await Quagga.decodeSingle(config as any);
    // Decode may return null when halfSample is applied at acquisition
    expect(result === null || typeof result === 'object', 'result should be object or null').to.be.true;
    const imgCanvas = (Quagga.canvas.dom && (Quagga.canvas.dom as any).image) || (Quagga.canvas.ctx && (Quagga.canvas.ctx as any).image && (Quagga.canvas.ctx as any).image.canvas) || null;
    const overlayCanvas = (Quagga.canvas.dom && (Quagga.canvas.dom as any).overlay) || (Quagga.canvas.ctx && (Quagga.canvas.ctx as any).overlay && (Quagga.canvas.ctx as any).overlay.canvas) || null;
    const docCanvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    const chosen = (imgCanvas || overlayCanvas || docCanvas) as HTMLCanvasElement | null;
    const mean = canvasMeanRGBA(chosen);
    const prev = (window as any).__mean_no_halfsample;
    // Validate a difference: either decode differs or canvas mean differs
    const decodeDiffers = (result === null);
    const delta = Math.abs(mean.r - prev.r) + Math.abs(mean.g - prev.g) + Math.abs(mean.b - prev.b);
    expect(decodeDiffers || delta > 1, 'expect either decode result or canvas to differ').to.be.true;
  });
});
