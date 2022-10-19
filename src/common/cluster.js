// TODO: cluster.js and cv_utils.js are pretty tightly intertwined, making for a complex conversion
// into typescript. be warned. :-)

import { glMatrix, vec2 } from 'gl-matrix';

glMatrix.setMatrixArrayType(Array);
/**
 * Creates a cluster for grouping similar orientations of datapoints
 */
export default {
    create(point, threshold) {
        const points = [];
        const center = {
            rad: 0,
            vec: vec2.clone([0, 0]),
        };
        const pointMap = {};

        function add(pointToAdd) {
            pointMap[pointToAdd.id] = pointToAdd;
            points.push(pointToAdd);
        }

        function updateCenter() {
            let i; let
                sum = 0;
            for (i = 0; i < points.length; i++) {
                sum += points[i].rad;
            }
            center.rad = sum / points.length;
            center.vec = vec2.clone([Math.cos(center.rad), Math.sin(center.rad)]);
        }

        function init() {
            add(point);
            updateCenter();
        }

        init();

        return {
            add(pointToAdd) {
                if (!pointMap[pointToAdd.id]) {
                    add(pointToAdd);
                    updateCenter();
                }
            },
            fits(otherPoint) {
                // check cosine similarity to center-angle
                const similarity = Math.abs(vec2.dot(otherPoint.point.vec, center.vec));
                if (similarity > threshold) {
                    return true;
                }
                return false;
            },
            getPoints() {
                return points;
            },
            getCenter() {
                return center;
            },
        };
    },
    createPoint(newPoint, id, property) {
        return {
            rad: newPoint[property],
            point: newPoint,
            id,
        };
    },
};
