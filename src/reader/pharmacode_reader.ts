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
const WIDE_BAR_THRESHOLD = 1.6;

// Maximum allowed variation in space widths (coefficient of variation)
// Reduced from 0.4 to help with false positives, but allowing some tolerance
const MAX_SPACE_VARIANCE = 0.35;

// Minimum quiet zone requirement in barcode widths (pharmaceutical spec: 6mm min)
// We use 1x narrow bar width as a minimum quiet zone
const MIN_QUIET_ZONE_WIDTHS = 1;

// Allowed narrow/wide bar ratios (1:2, 1:2.5, 1:3)
// These are multipliers applied to narrow bar width
const ALLOWED_WIDE_BAR_RATIOS = [2.0, 2.5, 3.0];
const WIDE_BAR_RATIO_TOLERANCE = 0.05; // Allow 5% deviation from the detected ratio

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
     * Smooth bar widths to reduce edge-detection jitter from colored barcodes.
     * Applies median filter to adjacent bars: if a bar is 1–3px different from neighbors,
     * snap it to the median of local bars to stabilize measurements.
     */
    protected _smoothBarWidths(bars: number[]): number[] {
        if (bars.length <= 2) {
            return bars; // Not enough bars to smooth
        }

        const smoothed = bars.slice();
        for (let i = 1; i < smoothed.length - 1; i++) {
            const prev = smoothed[i - 1];
            const curr = smoothed[i];
            const next = smoothed[i + 1];
            
            // If current bar is significantly different from neighbors, snap to median
            const median = [prev, curr, next].sort((a, b) => a - b)[1];
            const deviation = Math.abs(curr - median);
            
            // If deviation is small (1–3px), snap to median to reduce noise
            if (deviation > 0 && deviation <= 3) {
                smoothed[i] = median;
            }
        }
        return smoothed;
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
                // If we hit the edge of the scan area, don't count this as a valid space
                // It's likely truncated or includes the edge boundary
                if (pos >= this._row.length) {
                    // Reached the edge, stop here without adding this space
                    break;
                }
                // Check if this might be the trailing quiet zone
                // The quiet zone is typically much larger than inter-bar spaces
                if (spaces.length >= 2) {
                    const sortedSpaces = spaces.slice().sort((a, b) => a - b);
                    const median = sortedSpaces[Math.floor(sortedSpaces.length / 2)];
                    if (currentWidth > median * 2.5) {
                        break;
                    }
                } else if (spaces.length === 0 && bars.length >= 1) {
                    // For the first space, check against the first bar width
                    // Normal inter-bar spaces shouldn't exceed ~10x the bar width
                    if (currentWidth > bars[0] * 10) {
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

        // Apply smoothing to reduce edge-detection jitter on colored barcodes
        const smoothedBars = this._smoothBarWidths(bars);

        return { bars: smoothedBars, spaces, end: pos };
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
     * Validate that narrow and wide bars follow a consistent ratio (1:2, 1:2.5, or 1:3)
     * This is a spec requirement for pharmacodes
     */
    protected _validateBarRatios(bars: number[], spaces: number[]): { narrowWidth: number, wideRatio: number } | null {
        // If all bars are essentially the same width (low variance), need to determine if narrow or wide
        const avgAll = bars.reduce((a, b) => a + b, 0) / bars.length;
        const varAll = bars.reduce((a, b) => a + Math.abs(b - avgAll), 0) / bars.length;
        const cvAll = avgAll === 0 ? 0 : varAll / avgAll;
        
        if (cvAll <= 0.1) {
            // Low variance: could be all-narrow or all-wide
            // Use space widths as a hint: spaces should be ~1.25x the narrow bar width
            const avgSpace = spaces.length > 0 ?
                (spaces.reduce((a, b) => a + b, 0) / spaces.length) :
                0;
            
            if (avgSpace > 0) {
                const spaceToBarRatio = avgSpace / avgAll;
                // If spaces are much smaller than bars, bars are likely wide (ratio should be ~0.3-0.5)
                // If spaces are comparable to bars or larger, bars are likely narrow (ratio should be ~1.0-1.5)
                if (spaceToBarRatio < 0.7) {
                    // Bars are likely wide; infer narrow width from them
                    // Use the closest allowed ratio
                    const inferredNarrow = avgAll / 2.5; // Try middle ratio first
                    return { narrowWidth: inferredNarrow, wideRatio: 2.5 };
                }
            }
            
            // Default: treat as all-narrow
            return { narrowWidth: avgAll, wideRatio: 2.0 };
        }
        // Explore multiple possible thresholds (midpoints between sorted unique widths)
        // and pick the one that best matches an allowed ratio with low per-bar deviation.
        const sortedUnique = Array.from(new Set(bars.slice().sort((a, b) => a - b)));
        if (sortedUnique.length < 2) {
            // All bars identical: treat as single-width (valid pharmacode of all narrow or all wide)
            const avgWidth = bars.reduce((a, b) => a + b, 0) / bars.length;
            return { narrowWidth: avgWidth, wideRatio: 2.0 };
        }

        type Candidate = {
            threshold: number;
            narrowBars: number[];
            wideBars: number[];
            avgN: number;
            avgW: number;
            ratio: number;
            ratioDiff: number;
            matchedRatio: number;
        };

        const candidates: Candidate[] = [];

        // Generate candidate thresholds at midpoints between consecutive unique widths
        for (let i = 0; i < sortedUnique.length - 1; i++) {
            const t = (sortedUnique[i] + sortedUnique[i + 1]) / 2;
            const n: number[] = [];
            const w: number[] = [];
            for (const b of bars) {
                if (b < t) {
                    n.push(b);
                } else {
                    w.push(b);
                }
            }

            if (n.length === 0 || w.length === 0) {
                continue; // need both groups
            }

            const avgN = n.reduce((a, b) => a + b, 0) / n.length;
            const avgW = w.reduce((a, b) => a + b, 0) / w.length;
            const ratio = avgW / avgN;

            // Find closest allowed ratio
            let bestRatio = ALLOWED_WIDE_BAR_RATIOS[0];
            let bestDiff = Math.abs(ratio - bestRatio);
            for (const r of ALLOWED_WIDE_BAR_RATIOS) {
                const d = Math.abs(ratio - r);
                if (d < bestDiff) {
                    bestDiff = d;
                    bestRatio = r;
                }
            }

            candidates.push({
                threshold: t,
                narrowBars: n,
                wideBars: w,
                avgN,
                avgW,
                ratio,
                ratioDiff: bestDiff,
                matchedRatio: bestRatio,
            });
        }

        // Sort candidates by how close the ratio is to allowed ratios
        candidates.sort((a, b) => a.ratioDiff - b.ratioDiff);

        for (const c of candidates) {
            // Check ratio within tolerance
            const tolerance = c.matchedRatio * WIDE_BAR_RATIO_TOLERANCE;
            if (Math.abs(c.ratio - c.matchedRatio) > tolerance) {
                continue;
            }

            // Per-bar consistency checks
            const narrowTolerance = c.avgN * 0.3;
            const wideTolerance = c.avgW * 0.3;
            let ok = true;
            for (const b of c.narrowBars) {
                if (Math.abs(b - c.avgN) > narrowTolerance) { ok = false; break; }
            }
            if (!ok) continue;
            for (const b of c.wideBars) {
                if (Math.abs(b - c.avgW) > wideTolerance) { ok = false; break; }
            }
            if (!ok) continue;

            // Accept first viable candidate (closest ratio)
            return { narrowWidth: c.avgN, wideRatio: c.matchedRatio };
        }

        return null;
    }

    /**
     * Verify that there is sufficient quiet zone at start and end
     * When area constraints are used, the quiet zone may be truncated,
     * so we check if we have at least SOME quiet zone or hit the scan boundary
     */
    protected _validateQuietZones(startInfo: BarcodePosition, narrowWidth: number, end: number): boolean {
        const minQuietZone = narrowWidth * MIN_QUIET_ZONE_WIDTHS;

        // Check leading quiet zone
        // If we're very close to the start (within 2 pixels), we likely hit the area boundary
        // In that case, accept it as we can't verify the quiet zone
        if (startInfo.start >= 2 && startInfo.start < minQuietZone) {
            return false;
        }

        // Check trailing quiet zone
        // If we're at or very close to the end of the row, we likely hit the area boundary
        // or found a large quiet zone that extended to the edge - both are acceptable
        const remainingSpace = this._row.length - end;
        if (remainingSpace >= 2 && remainingSpace < minQuietZone) {
            return false;
        }

        return true;
    }

    /**
     * Classify bars as narrow or wide and decode the value
     */
    protected _decodeBars(bars: number[], narrowWidth?: number): { value: number, pattern: string } | null {
        // Use provided narrowWidth if available (from _validateBarRatios inference)
        // Otherwise, find the minimum bar width (likely narrow bar)
        const minWidth = narrowWidth ?? Math.min(...bars);

        // If all bars are similar width, it might be a valid Pharmacode with all narrow or all wide bars
        // But we need to determine the threshold
        const threshold = minWidth * WIDE_BAR_THRESHOLD;

        // Calculate the Pharmacode value using the correct algorithm
        // Position n starts at 0 on the RIGHT (last bar in array)
        // Narrow bar at position n adds 2^n
        // Wide bar at position n adds 2^(n+1)
        let value = 0;

        // Reverse bars to process right-to-left
        const reversedBars = bars.slice().reverse();

        for (let i = 0; i < reversedBars.length; i++) {
            const isWide = reversedBars[i] > threshold;
            if (isWide) {
                value += Math.pow(2, i + 1);
            } else {
                value += Math.pow(2, i);
            }
        }

        // Build human-readable bar pattern for debugging
        let pattern = '';
        for (let i = reversedBars.length - 1; i >= 0; i--) {
            pattern += reversedBars[i] > threshold ? 'W' : 'N';
        }

        return { value, pattern };
    }

    /**
     * Verify trailing whitespace (quiet zone)
     */
    protected _verifyTrailingWhitespace(end: number, barWidth: number): boolean {
        const trailingWhitespaceEnd = Math.min(end + barWidth * 2, this._row.length);
        return this._matchRange(end, trailingWhitespaceEnd, 0);
    }

    /**
     * Check pattern consistency: extract bars from slightly shifted positions.
     * Real barcodes should produce consistent bar patterns even with small shifts.
     * Text patterns are typically edge-based and will break with a small shift.
     */
    protected _validatePatternConsistency(startInfo: BarcodePosition, bars: number[]): boolean {
        const originalStart = startInfo.start;
        let consistentOffsets = 0;
        let totalChecks = 0;

        // Check positions offset by ±1 and ±2 pixels (simulate scanning lines nearby)
        for (const offset of [-2, -1, 1, 2]) {
            const shiftedStart = originalStart + offset;
            if (shiftedStart < 0 || shiftedStart >= this._row.length) {
                continue;
            }

            totalChecks++;

            // Try to extract bars from shifted position
            const shiftedExtracted = this._extractBarsAndSpaces(shiftedStart);
            if (!shiftedExtracted) {
                continue;
            }

            // If we got bars and they match in count, it's more likely a real barcode
            if (shiftedExtracted.bars.length === bars.length) {
                // Check if bar widths are roughly similar (within 25%)
                let barsMatch = true;
                for (let i = 0; i < bars.length; i++) {
                    const diff = Math.abs(shiftedExtracted.bars[i] - bars[i]) / Math.max(bars[i], 1);
                    if (diff > 0.25) {
                        barsMatch = false;
                        break;
                    }
                }
                if (barsMatch) {
                    consistentOffsets++;
                }
            }
        }

        // Real barcodes should be consistent across multiple shifted positions
        // Text patterns typically fail this test
        if (totalChecks > 0 && consistentOffsets >= totalChecks * 0.5) {
            return true; // Consistent across at least 50% of positions
        }
        return false;
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

        // Reject extremely short patterns (total width < 20px)
        // Calculate actual barcode width from sum of bars and spaces
        const barsWidth = bars.reduce((sum, w) => sum + w, 0);
        const spacesWidth = spaces.reduce((sum, w) => sum + w, 0);
        const totalBarcodeWidth = barsWidth + spacesWidth;
        if (totalBarcodeWidth < 20) {
            return null;
        }

        // Validate space uniformity
        if (!this._validateSpaces(spaces)) {
            return null;
        }

        // For short patterns, validate consistency across shifted positions
        // to reject text/noise patterns that appear as bars due to edge detection
        if (!this._validatePatternConsistency(startInfo, bars)) {
            return null;
        }

        // Validate bar width ratios are consistent (1:2, 1:2.5, or 1:3)
        const ratioInfo = this._validateBarRatios(bars, spaces);
        if (!ratioInfo) {
            return null;
        }

        // Validate quiet zones meet pharmaceutical spec
        if (!this._validateQuietZones(startInfo, ratioInfo.narrowWidth, end)) {
            return null;
        }

        // Decode the bars, passing the inferred narrowWidth for all-wide/all-narrow patterns
        const decoded = this._decodeBars(bars, ratioInfo.narrowWidth);
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
            pattern: decoded.pattern,
            format: this.FORMAT,
        };
    }
}

export default PharmacodeReader;
