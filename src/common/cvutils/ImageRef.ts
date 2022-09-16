import { clone as vec2clone } from 'gl-vec2';
import { clone as vec3clone } from 'gl-vec3';

export default class ImageRef {
    constructor(public x: number, public y: number) {}

    toVec2() {
        return vec2clone([this.x, this.y]);
    }

    toVec3() {
        return vec3clone([this.x, this.y, 1]);
    }

    round() {
        this.x = this.x > 0.0 ? Math.floor(this.x + 0.5) : Math.floor(this.x - 0.5);
        this.y = this.y > 0.0 ? Math.floor(this.y + 0.5) : Math.floor(this.y - 0.5);
        return this;
    }
}
