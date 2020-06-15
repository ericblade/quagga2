export default function getViewPort(target?: Element | string): Element | null {
    if (typeof document === 'undefined') {
        return null;
    }

    // Check if target is already a DOM element
    if (target instanceof HTMLElement && target.nodeName && target.nodeType === 1) {
        return target;
    }
    // Use '#interactive.viewport' as a fallback selector (backwards compatibility)
    const selector = typeof target === 'string' ? target : '#interactive.viewport';
    return document.querySelector(selector);
}
