import ImageDebug from '../common/image_debug';
import { QuaggaJSCodeResult, QuaggaJSResultCollector, QuaggaJSResultCollectorFilterFunction, XYSize, QuaggaImageData } from '../../type-definitions/quagga';

function contains(codeResult: QuaggaJSCodeResult, list: Array<QuaggaJSCodeResult>) {
    if (!list) return false;
    return list.some((item) => {
        const keys = Object.keys(item) as Array<keyof QuaggaJSCodeResult>;
        return keys.every((key) => item[key] === codeResult[key]);
    });
}

function passesFilter(codeResult: QuaggaJSCodeResult, filter: QuaggaJSResultCollectorFilterFunction | undefined) {
    if (typeof filter === 'function') {
        return filter(codeResult);
    }
    return true;
}

export default {
    create: function(config: QuaggaJSResultCollector) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        const results:Array<QuaggaJSCodeResult> = [];
        let capacity = config.capacity ?? 20;
        const capture = config.capture === true;

        function matchesConstraints(codeResult: QuaggaJSCodeResult) {
            return capacity
                && codeResult
                && !contains(codeResult, config.blacklist as Array<QuaggaJSCodeResult>)
                && passesFilter(codeResult, config.filter);
        }
        
        return {
            addResult: function(data: QuaggaImageData, imageSize: XYSize, codeResult: QuaggaJSCodeResult) {
                const result: any = { }; // this is 'any' to avoid having to construct a whole QuaggaJSCodeResult :|
                if (matchesConstraints(codeResult)) {
                    capacity--;
                    result.codeResult = codeResult;
                    if (capture) {
                        canvas.width = imageSize.x;
                        canvas.height = imageSize.y;
                        ImageDebug.drawImage(data, imageSize, ctx);
                        result.frame = canvas.toDataURL();
                    }
                    results.push(result);
                }
            },
            getResults: function() {
                return results;
            },
        };
    },
};
