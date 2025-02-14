var ObjectSids = 0;

export default class GameObject {

    /**
     * @param {string} name 
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @param {number} radius 
     * @param {number} pwr
     */

    constructor(name, x, y, width = 0, height = 0, scale = 0, pwr = 0) {
        this.sid = ObjectSids;
        ObjectSids++;

        this.name = name;
        this.x = x;
        this.y = y;

        this.scale = scale;
        this.power = pwr;

        this.width = width;
        this.height = height;

        if (this.name == "healing beacon") {
            this.layer = 2;
        } else if (this.name == "wall") {
            this.layer = 1;
        } else {
            this.layer = 0;
        }

        if (this.name == "beacon") {
            this.capturePoints = 0;
        }
    }
}