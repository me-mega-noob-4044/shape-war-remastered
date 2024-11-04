import config from "../../../src/js/config.js";
import projectiles from "../../../src/js/projectiles.js";

self.projectileSids = 0;
export default class {
    constructor(x, y, name, id, range, dir, ownerSID, dmg, dontSid) {
        if (!dontSid) {
            this.sid = self.projectileSids;
            self.projectileSids++;
        }

        let data = projectiles[id];

        this.x = x;
        this.y = y;
        this.name = name; // Name of the weapon (eg: Punisher, Avenger, Thunder)
        this.type = data.type; // Type of projectile (eg: Energy, Rocket, Normal)
        this.owner = ownerSID;
        this.range = range;
        this.scale = data.scale;
        this.imageSource = data.imageSource;
        this.speed = data.speed;
        this.dir = dir;
        this.dmg = dmg;
    }

    update(players, server, delta) {
        let tmpSpd = this.speed * (delta || config.gameUpdateSpeed);
        this.x += Math.cos(this.dir) * tmpSpd;
        this.y += Math.sin(this.dir) * tmpSpd;
        this.range -= tmpSpd * (delta || config.gameUpdateSpeed);

        if (server) {
            for (let i = 0; i < players.length; i++) {}
        }
    }
}