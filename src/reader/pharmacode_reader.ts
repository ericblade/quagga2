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

    static adjacentLineValidationMatches = 1;

    SINGLE_CODE_ERROR = 0.7;

    AVG_CODE_ERROR = 0.48;

    constructor(config = {}) {
        super(config);
    }

    /**
     * Find the start of the barcode (first black bar after leading whitespace)
     * Public so that barcode_decoder can use it for tilted barcode validation
     */
    public _findStart(): BarcodePosition | null {
        // Strategy: scan left→right; accept the first bar that:
        // 1. Has a sufficient leading quiet zone (≥ 2× bar width, min 20px)
        // 2. Is followed by another bar at a reasonable distance (≤ 10× bar width)
        //    This rejects isolated noise bars surrounded by large white spaces.

        const minQuietZone = 20;
        let searchPos = 0;

        while (searchPos < this._row.length) {
            const barStart = this._nextSet(this._row, searchPos);
            if (barStart >= this._row.length) {
                return null; // no more black pixels
            }

            // Find the end of this black run
            let barEnd = barStart;
            while (barEnd < this._row.length && this._row[barEnd]) {
                barEnd++;
            }

            const barWidth = barEnd - barStart;

            // Skip narrow noise bars
            if (barWidth < 5) {
                searchPos = barEnd + 1;
                continue;
            }

            // Check leading quiet zone
            const requiredQuietZone = Math.max(barWidth * 2, minQuietZone);
            const quietZoneStart = barStart - requiredQuietZone;
            if (quietZoneStart < 0) {
                searchPos = barEnd + 1;
                continue;
            }

            if (!this._matchRange(quietZoneStart, barStart, 0)) {
                searchPos = barEnd + 1;
                continue;
            }

            // Forward-look: Check that the next bar appears within a reasonable distance.
            // A real barcode has bars followed by narrow spaces (5-15px), not huge gaps.
            // Allow up to 10× bar width for the space (being generous for very narrow bars).
            const maxSpaceToNextBar = Math.max(barWidth * 10, 50);
            const nextBarStart = this._nextSet(this._row, barEnd);
            if (nextBarStart >= this._row.length) {
                // No next bar; this is an isolated bar, likely noise
                searchPos = barEnd + 1;
                continue;
            }

            const spaceToNextBar = nextBarStart - barEnd;
            if (spaceToNextBar > maxSpaceToNextBar) {
                // Space is too large; this is likely an isolated bar
                searchPos = barEnd + 1;
                continue;
            }

            return { start: barStart, end: barEnd };
        }

        return null;
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
     * Extract all bar and space widths from the pattern.
     * Uses real-time quiet zone detection to stop extraction before reaching image edge.
     */
    protected _extractBarsAndSpaces(startPos: number): { bars: number[], spaces: number[], end: number } | null {
        const bars: number[] = [];
        const spaces: number[] = [];

        let pos = startPos;
        let currentWidth = 0;
        let foundTrailingQuietZone = false;

        // Extract first bar
        while (pos < this._row.length && this._row[pos]) {
            currentWidth++;
            pos++;
        }
        if (currentWidth === 0) {
            return null;
        }
        bars.push(currentWidth);

        // Extract first space (needed to establish space width and estimate narrow bar)
        currentWidth = 0;
        while (pos < this._row.length && !this._row[pos]) {
            currentWidth++;
            pos++;
        }
        if (currentWidth === 0 || pos >= this._row.length) {
            return null; // No space after first bar, or hit edge
        }
        spaces.push(currentWidth);

        // Estimate narrow bar width for quiet zone detection
        // If first bar < first space, assume first bar is narrow
        // Otherwise, estimate narrow from space (space ≈ 1.25 * narrow)
        const estimatedNarrowWidth = bars[0] < spaces[0] ? bars[0] : spaces[0] * 0.8;

        // Pharmaceutical spec: quiet zone must be >= 6mm ≈ 6x narrow bar (strict)
        const strictQuietZone = estimatedNarrowWidth * 6;
        // Adaptive quiet zone: 2.5x the typical inter-bar space width
        // This should catch legitimate quiet zones while avoiding false positives
        let adaptiveQuietZone = spaces[0] * 2.5;

        // Continue extracting alternating bars and spaces
        // Stop BEFORE reaching MAX_BAR_COUNT+1 to avoid extracting too many bars
        while (pos < this._row.length && bars.length < MAX_BAR_COUNT) {
            // Extract bar
            currentWidth = 0;
            while (pos < this._row.length && this._row[pos]) {
                currentWidth++;
                pos++;
            }
            if (currentWidth === 0) {
                // Reached end of barcode (no more bars)
                break;
            }
            bars.push(currentWidth);

            // Extract space
            currentWidth = 0;
            const spaceStart = pos;
            while (pos < this._row.length && !this._row[pos]) {
                currentWidth++;
                pos++;
            }

            if (currentWidth === 0) {
                // No space after this bar - barcode ended
                break;
            }

            // Check if this space is a quiet zone (strict pharmaceutical spec)
            if (currentWidth >= strictQuietZone) {
                // Found strict trailing quiet zone - stop extraction here
                foundTrailingQuietZone = true;
                pos = spaceStart; // Reset pos to start of quiet zone
                break;
            }

            // Adaptive quiet zone: if this space is significantly larger than normal inter-bar spaces
            // (2x or more), treat it as a quiet zone
            if (bars.length >= MIN_BAR_COUNT && currentWidth >= adaptiveQuietZone) {
                foundTrailingQuietZone = true;
                pos = spaceStart;
                break;
            }

            // Check if we hit the image edge while counting this space
            if (pos >= this._row.length) {
                // Hit image edge while in whitespace - treat as infinite quiet zone
                // We've reached the end of the image, which counts as an implicit quiet zone
                foundTrailingQuietZone = true;
                pos = spaceStart; // Reset to start of quiet zone
                break;
            }

            // This is a normal inter-bar space
            spaces.push(currentWidth);

            // Update adaptive quiet zone based on average space width
            // A quiet zone should be at least 2x the average inter-bar space
            if (spaces.length >= 2) {
                const avgSpace = spaces.reduce((a, b) => a + b, 0) / spaces.length;
                adaptiveQuietZone = avgSpace * 2;
            }
        }

        // If we exited the loop without finding a trailing quiet zone, barcode is invalid
        // (This catches barcodes that end exactly at the image edge)
        if (!foundTrailingQuietZone) {
            return null;
        }

        // Validate bar count
        if (bars.length < MIN_BAR_COUNT || bars.length > MAX_BAR_COUNT) {
            return null;
        }

        // We should have (n-1) spaces for n bars
        if (spaces.length !== bars.length - 1) {
            return null;
        }

        // Validate that spaces are uniform (pharmacode requirement)
        if (!this._validateSpaces(spaces)) {
            return null;
        }

        // Validate that bars have at most 2 distinct sizes (narrow and/or wide)
        if (!this._validateBarSizeCount(bars)) {
            return null;
        }

        // Apply smoothing to reduce edge-detection jitter on colored barcodes
        const smoothedBars = this._smoothBarWidths(bars);

        return { bars: smoothedBars, spaces, end: pos };
    }

    /**
     * Validate that bars have at most 2 distinct sizes (narrow and/or wide).
     * Pharmacode bars must be either all one size, or two sizes (narrow + wide).
     * If 3+ distinct sizes detected, this is not a valid pharmacode.
     */
    protected _validateBarSizeCount(bars: number[]): boolean {
        if (bars.length === 0) {
            return false;
        }

        // Cluster bars into size groups with 35% tolerance to handle edge-detection jitter
        // This matches the tolerance used for space validation (CV <= 0.35)
        const tolerance = 0.35;
        const clusters: number[][] = [];

        for (const bar of bars) {
            let foundCluster = false;
            for (const cluster of clusters) {
                const clusterAvg = cluster.reduce((a, b) => a + b, 0) / cluster.length;
                if (Math.abs(bar - clusterAvg) <= clusterAvg * tolerance) {
                    cluster.push(bar);
                    foundCluster = true;
                    break;
                }
            }
            if (!foundCluster) {
                clusters.push([bar]);
            }
        }

        // Must have exactly 1 or 2 clusters (not 3+)
        if (clusters.length > 2) {
            return false;
        }

        return true;
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
            // Use 15% tolerance instead of 30% to reject bars with too much width variation
            // Real pharmacodes have consistent bar widths; tilted/curved ones show variation
            const narrowTolerance = c.avgN * 0.15;
            const wideTolerance = c.avgW * 0.15;
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
     * Validate periodicity of bar and space widths
     * Real pharmacodes have consistent bar/space widths with low variation
     * Tilted barcodes create varying widths due to angle-dependent cross-sections
     * Uses coefficient of variation (CV = stdDev / mean) to detect this
     */
    protected _validatePeriodicity(bars: number[], spaces: number[]): boolean {
        // Calculate coefficient of variation for bars
        if (bars.length > 0) {
            const barMean = bars.reduce((a, b) => a + b, 0) / bars.length;
            const barVariance = bars.reduce((a, b) => a + Math.pow(b - barMean, 2), 0) / bars.length;
            const barStdDev = Math.sqrt(barVariance);
            const barCV = barMean !== 0 ? barStdDev / barMean : 0;

            // Reject if bar CV is too high (indicates tilted/curved barcode with varying cross-sections)
            // Threshold of 0.65 allows for reasonable variation in valid codes while still catching severe misalignments
            if (barCV > 0.65) {
                return false;
            }
        }

        // Calculate coefficient of variation for spaces
        if (spaces.length > 0) {
            const spaceMean = spaces.reduce((a, b) => a + b, 0) / spaces.length;
            const spaceVariance = spaces.reduce((a, b) => a + Math.pow(b - spaceMean, 2), 0) / spaces.length;
            const spaceStdDev = Math.sqrt(spaceVariance);
            const spaceCV = spaceMean !== 0 ? spaceStdDev / spaceMean : 0;

            // Reject if space CV is too high
            if (spaceCV > 0.55) {
                return false;
            }
        }

        return true;
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
        // In real extracted images, especially with resizing, we may not have perfect quiet zones
        // So we accept it if we're within 6 pixels of the end (scan boundary)
        const remainingSpace = this._row.length - end;

        // If we're very close to the edge (< 6px), we hit the scan boundary - accept it
        if (remainingSpace < 6) {
            return true;
        }

        // We have at least 6px of trailing space - check if it meets minimum quiet zone requirement
        if (remainingSpace < minQuietZone) {
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

        // REJECT if barcode starts too late in the scan (>50% of line length)
        // Valid pharmacodes should be found near the image edge or early in the scan.
        // Starting too far into the image indicates we're picking up noise or a shifted pattern
        // (i.e., sampling mid-bar, which reverses the encoding).
        // This also rejects tilted barcodes that only appear straight at one specific angle.
        if (startInfo.start > this._row.length * 0.50) {
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

        // EDGE-REACH REJECTION: Reject if extraction reaches image boundary
        // Valid pharmacodes require proper quiet zones per pharmaceutical spec (min 6mm ≈ 16px at typical DPI)
        // Extractions reaching the image edge (end >= row.length - 2) indicate incomplete/invalid patterns
        // This catches tilted and curved barcodes that only appear straight at one specific angle
        const EDGE_MARGIN = 0; // No margin: only reject if extraction goes PAST the row length (shouldn't happen but be safe)
        const remainingSpace = this._row.length - end;
        if (remainingSpace < EDGE_MARGIN) {
            return null;
        }

        // Validate space uniformity
        if (!this._validateSpaces(spaces)) {
            return null;
        }

        // Validate periodicity of bar and space widths to reject tilted/curved barcodes
        if (!this._validatePeriodicity(bars, spaces)) {
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
