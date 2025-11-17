import { describe, it } from 'mocha';
import { expect } from 'chai';
import Skeletonizer from '../../skeletonizer';

describe('Skeletonizer (Node.js-only)', () => {
    describe('asm.js Validation', () => {
        it('should not emit "Invalid asm.js" warning to stderr', (done) => {
            // Capture both stderr writes AND process warnings
            const originalWrite = process.stderr.write;
            const warnings: string[] = [];
            let stderrOutput = '';

            // Capture process warnings (V8 warnings go through this)
            const warningListener = (warning: Error) => {
                warnings.push(warning.message);
            };
            process.on('warning', warningListener);

            process.stderr.write = function(chunk: any): boolean {
                stderrOutput += chunk.toString();
                return true;
            };

            try {
                // Re-instantiate the module to trigger asm.js validation
                // Use 64KB (spec minimum) like production
                const testBuffer = new ArrayBuffer(64 * 1024);
                Skeletonizer(
                    { Math, Uint8Array },
                    { size: 8 },
                    testBuffer
                );

                // Wait briefly for async V8 warnings to be emitted
                setTimeout(() => {
                    // Combine all captured output
                    const allOutput = stderrOutput + warnings.join('\n');

                    // Check that no asm.js validation warnings appeared
                    try {
                        expect(allOutput).to.not.include('Invalid asm.js');
                        expect(allOutput).to.not.include('asm.js type error');
                        expect(allOutput).to.not.include('Linking failure in asm.js');
                        expect(allOutput).to.not.include('Invalid heap size');
                        done();
                    } catch (e) {
                        done(e);
                    } finally {
                        process.stderr.write = originalWrite;
                        process.removeListener('warning', warningListener);
                    }
                }, 50);
            } catch (e) {
                process.stderr.write = originalWrite;
                process.removeListener('warning', warningListener);
                done(e);
            }
        });
    });
});
