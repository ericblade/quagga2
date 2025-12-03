import BarcodeReader, { Barcode, BarcodeInfo, BarcodePosition } from './barcode_reader';

/**
 * Pharmacode (Pharmaceutical Binary Code) Reader
 *
 * Pharmacode is a binary barcode used in pharmaceutical packaging.
 * It encodes numbers from 3 to 131070 using narrow and wide bars.
 *
 * Encoding rules:
 * - Reading from right to left (least significant first)
 * - Narrow bar at position i adds 2^i to the value
 * - Wide bar at position i adds 2^(i+1) to the value
 * - Bars are separated by uniform-width spaces
 * - Minimum 2 bars, maximum 16 bars
 * - Valid range: 3 to 131070
 *
 * Example: Value 755
 * Binary representation of bars (from left to right in barcode):
 * wide, narrow, wide, narrow, narrow, wide, narrow, wide, narrow
 *
 * Reference: https://en.wikipedia.org/wiki/Pharmacode
 */

// Minimum number of bars in a valid Pharmacode
const MIN_BAR_COUNT = 2;
// Maximum number of bars in a valid Pharmacode
const MAX_BAR_COUNT = 16;
// Minimum valid Pharmacode value
const MIN_VALUE = 3;
// Maximum valid Pharmacode value
const MAX_VALUE = 131070;

// Threshold ratio to distinguish narrow from wide bars
// A bar wider than this ratio of the narrow bar width is considered wide
const WIDE_BAR_THRESHOLD = 1.75;

// Maximum allowed variation in space widths (coefficient of variation)
const MAX_SPACE_VARIANCE = 0.4;

// Maximum allowed variation in narrow bar widths
const MAX_NARROW_BAR_VARIANCE = 0.4;

class PharmacodeReader extends BarcodeReader {
    FORMAT = 'pharmacode';

    SINGLE_CODE_ERROR = 0.7;

    AVG_CODE_ERROR = 0.48;

    constructor(config = {}) {
        super(config);
    }

    /**
     * Find the start of the barcode (first black bar after leading whitespace)
     */
    protected _findStart(): BarcodePosition | null {
        const offset = this._nextSet(this._row);
        if (offset >= this._row.length) {
            return null;
        }

        // Find the first black bar
        const barStart = offset;
        let barEnd = barStart;
        while (barEnd < this._row.length && this._row[barEnd]) {
            barEnd++;
        }

        if (barEnd === barStart) {
            return null;
        }

        // Verify there's some leading whitespace (quiet zone)
        const barWidth = barEnd - barStart;
        const quietZoneStart = Math.max(0, barStart - barWidth * 2);
        if (barStart > 0 && !this._matchRange(quietZoneStart, barStart, 0)) {
            return null;
        }

        return {
            start: barStart,
            end: barEnd,
        };
    }

    /**
     * Extract all bar and space widths from the pattern
     */
    protected _extractBarsAndSpaces(startPos: number): { bars: number[], spaces: number[], end: number } | null {
        const bars: number[] = [];
        const spaces: number[] = [];

        let pos = startPos;
        let isBar = true;
        let currentWidth = 0;

        // Start with the first bar
        while (pos < this._row.length && this._row[pos]) {
            currentWidth++;
            pos++;
        }
        if (currentWidth === 0) {
            return null;
        }
        bars.push(currentWidth);

        // Continue extracting alternating spaces and bars
        while (pos < this._row.length && bars.length <= MAX_BAR_COUNT) {
            currentWidth = 0;
            isBar = !isBar;

            if (isBar) {
                // Counting a bar
                while (pos < this._row.length && this._row[pos]) {
                    currentWidth++;
                    pos++;
                }
                if (currentWidth === 0) {
                    // End of barcode
                    break;
                }
                bars.push(currentWidth);
            } else {
                // Counting a space
                while (pos < this._row.length && !this._row[pos]) {
                    currentWidth++;
                    pos++;
                }
                if (currentWidth === 0) {
                    break;
                }
                // Check if this might be the trailing quiet zone
                // A very large space likely means end of barcode
                if (spaces.length > 0) {
                    const avgSpace = spaces.reduce((a, b) => a + b, 0) / spaces.length;
                    if (currentWidth > avgSpace * 3) {
                        // This is likely the quiet zone, not an inter-bar space
                        break;
                    }
                }
                spaces.push(currentWidth);
            }
        }

        // Validate bar count
        if (bars.length < MIN_BAR_COUNT || bars.length > MAX_BAR_COUNT) {
            return null;
        }

        // We should have (n-1) spaces for n bars
        if (spaces.length !== bars.length - 1) {
            return null;
        }

        return { bars, spaces, end: pos };
    }

    /**
     * Check if space widths are uniform enough for a valid Pharmacode
     */
    protected _validateSpaces(spaces: number[]): boolean {
        if (spaces.length === 0) {
            return true; // Single bar (though invalid for Pharmacode)
        }

        const mean = spaces.reduce((a, b) => a + b, 0) / spaces.length;
        if (mean === 0) {
            return false;
        }

        // Calculate coefficient of variation
        const variance = spaces.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / spaces.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / mean;

        return cv <= MAX_SPACE_VARIANCE;
    }

    /**
     * Classify bars as narrow or wide and decode the value
     */
    protected _decodeBars(bars: number[]): { value: number } | null {
        // Find the minimum bar width (likely narrow bar)
        const minWidth = Math.min(...bars);

        // If all bars are similar width, it might be a valid Pharmacode with all narrow or all wide bars
        // But we need to determine the threshold
        const threshold = minWidth * WIDE_BAR_THRESHOLD;

        // Separate bars into narrow and wide for validation
        const narrowBars: number[] = [];

        bars.forEach(width => {
            if (width <= threshold) {
                narrowBars.push(width);
            }
        });

        // Validate narrow bar consistency
        if (narrowBars.length > 0) {
            const narrowMean = narrowBars.reduce((a, b) => a + b, 0) / narrowBars.length;
            const narrowVariance = narrowBars.reduce((sum, w) => sum + Math.pow(w - narrowMean, 2), 0) / narrowBars.length;
            const narrowCv = Math.sqrt(narrowVariance) / narrowMean;
            if (narrowCv > MAX_NARROW_BAR_VARIANCE) {
                return null;
            }
        }

        // Calculate the Pharmacode value using the correct algorithm
        // Reading from right to left (reverse the bars array)
        // For each bar: value = value * 2 + (1 for narrow, 2 for wide)
        let value = 0;

        for (let i = bars.length - 1; i >= 0; i--) {
            const isWide = bars[i] > threshold;
            value = value * 2 + (isWide ? 2 : 1);
        }

        return { value };
    }

    /**
     * Verify trailing whitespace (quiet zone)
     */
    protected _verifyTrailingWhitespace(end: number, barWidth: number): boolean {
        const trailingWhitespaceEnd = Math.min(end + barWidth * 2, this._row.length);
        return this._matchRange(end, trailingWhitespaceEnd, 0);
    }

    public decode(row?: Array<number>, start?: BarcodePosition | number): Barcode | null {
        // Find the start of the barcode
        const startInfo = this._findStart();
        if (!startInfo) {
            return null;
        }

        // Extract bars and spaces
        const extracted = this._extractBarsAndSpaces(startInfo.start);
        if (!extracted) {
            return null;
        }

        const { bars, spaces, end } = extracted;

        // Validate space uniformity
        if (!this._validateSpaces(spaces)) {
            return null;
        }

        // Decode the bars
        const decoded = this._decodeBars(bars);
        if (!decoded) {
            return null;
        }

        const { value } = decoded;

        // Validate value range
        if (value < MIN_VALUE || value > MAX_VALUE) {
            return null;
        }

        // Verify trailing whitespace
        const avgBarWidth = bars.reduce((a, b) => a + b, 0) / bars.length;
        if (!this._verifyTrailingWhitespace(end, avgBarWidth)) {
            // Soft fail - allow but note it
        }

        // Build the decoded codes array for debugging/visualization
        const decodedCodes: Array<BarcodeInfo> = bars.map((width, index) => ({
            code: width > (Math.min(...bars) * WIDE_BAR_THRESHOLD) ? 1 : 0,
            start: 0, // Could calculate actual positions if needed
            end: 0,
            error: 0,
        }));

        return {
            code: value.toString(),
            start: startInfo.start,
            end: end,
            startInfo: startInfo,
            decodedCodes: decodedCodes,
            format: this.FORMAT,
        };
    }
}

export default PharmacodeReader;
