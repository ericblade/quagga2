export default function getViewPort(target: HTMLElement | string) {
    if (typeof document === 'undefined') {
        return null;
    }

    // Check if target is already a DOM element
    if (target instanceof HTMLElement && target.nodeName && target.nodeType === 1) {
        return target;
    } else {
        // Use '#interactive.viewport' as a fallback selector (backwards compatibility)
        const selector = typeof target === 'string' ? target : '#interactive.viewport';
        return document.querySelector(selector);
    }
}
