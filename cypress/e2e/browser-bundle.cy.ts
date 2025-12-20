// Test that the browser bundle (dist/quagga.min.js) works correctly with decodeSingle
// This validates that the built bundle can decode images in a browser context

/// <reference types="cypress" />

describe('Browser Bundle - decodeSingle', () => {
    before(() => {
        // Create a minimal test HTML file
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bundle Test</title>
</head>
<body>
    <script src="/dist/quagga.min.js"></script>
</body>
</html>`;
        cy.writeFile('cypress/fixtures/bundle-test.html', html);
    });

    after(() => {
        // Clean up the temporary file even if test passes
        cy.task('cleanupBundleFixture');
    });

    beforeEach(() => {
        cy.visit('/cypress/fixtures/bundle-test.html');
    });

    it('should decode a Code 128 barcode from dist/quagga.min.js', () => {
        cy.window().should('have.property', 'Quagga');

        cy.window().then((win) => {
            return new Cypress.Promise((resolve, reject) => {
                // Use a fixture image path relative to the server root
                const imagePath = '/test/fixtures/code_128/image-001.jpg';

                win.Quagga.decodeSingle({
                    src: imagePath,
                    numOfWorkers: 0,
                    inputStream: {
                        size: 800
                    },
                    decoder: {
                        readers: ['code_128_reader']
                    },
                }, (result: any) => {
                    if (result && result.codeResult) {
                        cy.log('Decoded:', result.codeResult.code);
                        expect(result.codeResult.code).to.be.a('string');
                        expect(result.codeResult.code.length).to.be.greaterThan(0);
                        resolve(result);
                    } else {
                        reject(new Error('Failed to decode barcode'));
                    }
                });
            });
        });
    });
});
