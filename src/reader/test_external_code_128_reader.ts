/**
 * Example external Code 128 reader for testing the external reader plugin mechanism.
 * This demonstrates how users can create custom readers by extending built-in ones.
 */

import Code128Reader from './code_128_reader';

/**
 * TestExternalCode128Reader - A simple wrapper around Code128Reader
 * that demonstrates the external reader plugin API.
 * 
 * In a real-world scenario, this could add:
 * - Custom preprocessing
 * - Additional validation
 * - Custom decode logic
 * - Logging/telemetry
 */
class TestExternalCode128Reader extends Code128Reader {
    /**
     * The FORMAT should remain 'code_128' to maintain compatibility with existing tests.
     * In a real external reader for a different format, you would set this to your format name.
     */
    FORMAT = 'code_128' as const;

    /**
     * Decode method that wraps the parent implementation.
     * For this test reader, we simply call the parent implementation.
     * In a real external reader, you might add custom logic here.
     */
    // The decode method is inherited from Code128Reader - no override needed for tests
}

export default TestExternalCode128Reader;
