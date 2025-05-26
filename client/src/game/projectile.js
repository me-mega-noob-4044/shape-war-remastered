import config from "../../../src/js/config.js";
import projectiles from "../../../src/js/projectiles.js";
import * as UTILS from "../../../src/js/utils.js";

self.projectileSids = 0;

export default class Projectile {

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {string} name 
     * @param {number} id 
     * @param {number} range 
     * @param {number} dir 
     * @param {number} ownerSID 
     * @param {number} dmg 
     * @param {number} aoeEffectRange 
     * @param {boolean} dontSid 
     */

    constructor(x, y, name, id, range, dir, ownerSID, dmg, aoeEffectRange, dontSid) {
        if (!dontSid) {
            this.sid = self.projectileSids;
            self.projectileSids++;
        }

        let data = projectiles[id];

        /** @type {number} */

        this.x = x;

        /** @type {number} */

        this.y = y;

        this.name = name; // Name of the weapon (eg: Punisher, Avenger, Thunder)
        this.type = data.type; // Type of projectile (eg: Energy, Rocket, Normal)

        /** @type {number} */

        this.owner = ownerSID;

        /** @type {number} */

        this.range = range;

        /** @type {number} */

        this.scale = data.scale;
        this.imageSource = data.imageSource;

        /** @type {number} */

        this.speed = data.speed;

        /** @type {number} */

        this.dir = dir;

        /** @type {number} */

        this.dmg = dmg;

        /** @type {number} */

        this.aoeEffectRange = aoeEffectRange;

        this.active = true;
    }

    update(players, server, delta) {
        let tmpSpd = this.speed * (delta || config.gameUpdateSpeed);

        let oldX = this.x, oldY = this.y;

        this.x += Math.cos(this.dir) * tmpSpd;
        this.y += Math.sin(this.dir) * tmpSpd;


        this.range -= UTILS.getDistance({ x: oldX, y: oldY }, this);

        if (this.range <= 0) {
            this.active = false;
        }

        if (server) { }
    }
}