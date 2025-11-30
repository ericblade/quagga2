/**
 * Preprocessing module - provides image preprocessing capabilities
 * that run between frame grabbing and barcode localization/decoding.
 * 
 * This is a barrel file that re-exports the public API of the preprocessing module.
 */
export type { QuaggaImagePreprocessor } from './preprocessor';
export {
    addBorder,
    applyPreprocessors,
    Preprocessors,
} from './preprocessor';
