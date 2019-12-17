import ImageDebug from '../common/image_debug';
import { QuaggaJSCodeResult, QuaggaJSResultCollector, QuaggaJSResultCollectorFilterFunction, XYSize, QuaggaJSResultObject } from '../../type-definitions/quagga';

function contains(codeResult: QuaggaJSCodeResult, list: Array<QuaggaJSCodeResult> | undefined) {
    if (list) {
        return list.some(function (item) {
            return Object.keys(item).every(function (key) {
                return item[key] === codeResult[key];
            });
        });
    }
    return false;
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
        const ctx = canvas.getContext('2d');
        const results:Array<QuaggaJSCodeResult> = [];
        let capacity = config.capacity ?? 20;
        const capture = config.capture === true;

        function matchesConstraints(codeResult: QuaggaJSCodeResult) {
            return capacity
                && codeResult
                && !contains(codeResult, config.blacklist)
                && passesFilter(codeResult, config.filter);
        }

        return {
            addResult: function(data: ImageData, imageSize: XYSize, codeResult: QuaggaJSCodeResult) {
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
