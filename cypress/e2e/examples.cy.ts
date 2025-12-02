// E2E tests for example pages
describe('Example Pages E2E', () => {
    describe('live_w_locator.html', () => {
        beforeEach(() => {
            cy.visit('http://localhost:8080/live_w_locator.html');
        });

        afterEach(() => {
            cy.window().then((win: any) => {
                if (win.Quagga && win.Quagga.stop) {
                    const stopPromise = win.Quagga.stop();
                    if (stopPromise && typeof stopPromise.then === 'function') {
                        return cy.wrap(stopPromise);
                    }
                }
            });
        });

        after(() => {
            cy.window().then((win: any) => {
                if (win.Quagga && win.Quagga.stop) {
                    const stopPromise = win.Quagga.stop();
                    if (stopPromise && typeof stopPromise.then === 'function') {
                        return cy.wrap(stopPromise);
                    }
                }
            });
        });

        it('should load the page successfully', () => {
            cy.contains('h1', 'QuaggaJS').should('be.visible');
        });

        it('should have a camera dropdown', () => {
            cy.get('select#deviceSelection').should('exist');
        });

        it('should have a locate checkbox', () => {
            cy.get('input[name="locate"]').should('exist');
        });

        it('should have canvas elements', () => {
            // Canvas is created by Quagga inside #interactive div
            cy.get('#interactive').should('exist');
        });

        it('should have Quagga available on window', () => {
            cy.window().its('Quagga').should('exist');
        });

        it('should toggle locate checkbox', () => {
            cy.get('input[name="locate"]').uncheck().should('not.be.checked');
            cy.get('input[name="locate"]').check().should('be.checked');
        });

        it('should populate camera dropdown with devices', () => {
            // Wait for devices to be enumerated and dropdown populated
            cy.get('select#deviceSelection option', { timeout: 10000 })
                .should('have.length.at.least', 1);
        });


        it('provides scanning area box when locate=false', () => {
            // Wait for Quagga to be initialized and processing frames before toggling locate
            cy.window().then((win: any) => {
                expect(win.Quagga).to.exist;
                return new Cypress.Promise((resolve) => {
                    const timeout = setTimeout(() => resolve(null), 1500);
                    win.Quagga.onProcessed(() => {
                        clearTimeout(timeout);
                        resolve(null);
                    });
                });
            });

            // Now toggle locate off and wait for reinit
            cy.get('input[name="locate"]').uncheck().should('not.be.checked').trigger('change');
            cy.wait(400); // Allow time for debounced reinit (250ms) + init completion

            cy.window().then((win: any) => {
                expect(win.Quagga).to.exist;
                expect(win.Quagga.onProcessed).to.be.a('function');

                const p = new Cypress.Promise((resolve) => {
                    const timeout = setTimeout(() => resolve(null), 2000);

                    win.Quagga.onProcessed(function (result: any) {
                        if (result && (result.box || (result.boxes && result.boxes.length > 0))) {
                            clearTimeout(timeout);
                            resolve(result);
                        }
                    });
                });
                return cy.wrap(p, { timeout: 3000 });
            }).then((result: any) => {
                expect(result, 'Should receive result with box or boxes').to.exist;
                // When locate=false, should have either result.box or result.boxes
                const hasBox = result.box && Array.isArray(result.box) && result.box.length === 4;
                const hasBoxes = result.boxes && Array.isArray(result.boxes) && result.boxes.length > 0;
                expect(hasBox || hasBoxes, 'Should have either result.box or result.boxes with scanning area').to.be.true;
            });
        });

        it('continues processing frames after resolution change', () => {
            // Select a different resolution option dynamically (choose last option if available)
            cy.contains('label', 'Resolution (width)')
              .find('select[name="input-stream_constraints"]').then($sel => {
                  const current = ($sel[0] as HTMLSelectElement).value;
                  const options = Array.from(($sel[0] as HTMLSelectElement).options).map(o => o.value);
                  const alt = options.reverse().find(v => v !== current) || current;
                  cy.wrap($sel).select(alt);
              });
            // Verify frames continue after resolution change
            cy.window().then((win: any) => {
                expect(win.Quagga).to.exist;
                expect(win.Quagga.onProcessed).to.be.a('function');
                let count = 0;
                const p = new Cypress.Promise((resolve) => {
                    const timeout = setTimeout(() => resolve(null), 3000);
                    win.Quagga.onProcessed(() => {
                        count++;
                        if (count >= 3) {
                            clearTimeout(timeout);
                            resolve(null);
                        }
                    });
                });
                return cy.wrap(p, { timeout: 3500 }).then(() => {
                    expect(count).to.be.greaterThan(0);
                });
            });
        });

        it('continues processing frames after patch size change', () => {
            cy.contains('label', 'Patch-Size')
              .find('select[name="locator_patch-size"]').select('large');
            cy.window().then((win: any) => {
                expect(win.Quagga).to.exist;
                expect(win.Quagga.onProcessed).to.be.a('function');
                let count = 0;
                const p = new Cypress.Promise((resolve) => {
                    win.Quagga.onProcessed(() => { count++; if (count >= 3) resolve(null); });
                });
                return cy.wrap(p, { timeout: 3000 }).then(() => {
                    expect(count).to.be.greaterThan(0);
                });
            });
        });

        it('hides zoom and torch controls when unsupported', () => {
            // Labels wrap the inputs and are set to display:none when capability missing
            cy.get('label:has(select[name="settings_zoom"])').should('have.css', 'display', 'none');
            cy.get('label:has(input[name="settings_torch"])').should('have.css', 'display', 'none');
        });
    });
});
