import ability from "./ability.js";
import Drone from "./drone.js";
import Module from "./module.js";
import Weapon from "./weapon.js";

var shapeSid = 0;

export default class Shape {
    constructor(data, slot, dontAssignSID) {
        if (!dontAssignSID) {
            this.sid = shapeSid;
            shapeSid++;
        } else if (data.cost) {
            this.cost = { ...data.cost };
        }

        this.industryName = data.industryName;
        this.level = 1;
        this.tier = data.tier;
        this.name = data.name;
        this.description = data.description;
        this.fovMulti = data.fovMulti;
        this.indxRole = data.indxRole;
        this.color = data.color;
        this.scale = data.scale;
        this.aimTurnSpeed = data.aimTurnSpeed;
        this.slot = slot;
        this.weaponHardpoints = { ...data.weaponHardpoints };
        this.moduleHardpoints = { ...data.moduleHardpoints };
        this.maxhealth = this.health = data.healthData?.base || data.health;
        this.speed = data.speedData?.base || data.speed;
        this.activeModuleIndex = 0;
        this.abilities = [];

        this.vel = { x: 0, y: 0 };

        /** @type {Drone | null} */

        this.drone = null;

        /** @type {Module[]} */

        this.modules = [];

        /** @type {Weapon[]} */

        this.weapons = [];

        this.lastX = 0;
        this.lastY = 0;
        this.avoidBuildings = false;

        if (data.abilities.length) {
            this.abilities = [];
            for (let i = 0; i < data.abilities.length; i++) {
                let abilityData = data.abilities[i];
                this.abilities.push(new ability(abilityData));
            }
        }
    }
}