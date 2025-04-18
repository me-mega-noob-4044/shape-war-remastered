import ability from "./ability.js";
import Drone from "./drone.js";
import items from "./items.js";
import Module from "./module.js";
import Player from "./player.js";
import Weapon from "./weapon.js";

var shapeSid = 0;

class Game {

    /** @type {Map | null} */

    static map = null;
    static spawnIndx = 0;
    static points = [0, 0];

    static send(type) { }

    static updateGame() { }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} dir 
     * @param {Shape} owner 
     * @param {Weapon} wpn 
     * @param {number} extraSpeed 
     */

    static addProjectile(x, y, dir, owner, wpn, extraSpeed) { }

    static start() { }
}

export default class Shape {

    /**
     * @param {number} sid 
     */

    static setDefault(sid) {
        shapeSid = sid;
    }

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

        this.active = false;

        this.forcePosition = false;

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

        this.x = 0;
        this.y = 0;

        this.damageIndicators = {
            normal: 0, // FOR NORMAL HEALTH
            lastUpdateNormal: 0, // LAST DAMAGED FOR NORMAL HEALTH
            blue: 0, // FOR BLUE SHIELDS
            lastUpdateBlue: 0, // LAST DAMAGED FOR BLUE SHIELDS
            yellow: 0, // FOR YELLOW SHIELDS
            lastUpdateYellow: 0, // LAST DAMAGED FOR YELLOW SHIELDS
            purple: 0, // FOR PURPLE SHIELDS
            lastUpdatePurple: 0 // LAST DAMAGED FOR PURPLE SHIELDS
        };

        /** @type {number} */

        this.showDamageIndicator = 0;

        if (data.abilities.length) {
            this.abilities = [];
            for (let i = 0; i < data.abilities.length; i++) {
                let abilityData = data.abilities[i];
                this.abilities.push(new ability(abilityData));
            }
        }

        this.phaseShiftDuration = 0;
    }

    isPhaseShift() {
        return this.phaseShiftDuration > 0;
    }

    /**
     * @param {number} delta 
     */

    manageEffects(delta) {
        this.phaseShiftDuration -= delta;
        if (this.phaseShiftDuration <= 0) this.phaseShiftDuration = 0;
    }

    /**
     * @param {Player} player 
     * @param {number | string} id 
     * @param {Game} Game 
     */

    useAbility(player, id, Game) {
        if (id == "active") {
            let module = items.activeModules[this.activeModuleIndex];

            if (module.regenData) {
                this.activeModuleRegen = {
                    duration: module.duration,
                    power: module.regenData.power,
                    rate: 0,
                    maxRate: module.regenData.rate
                };
            } else if (module.name == "Phase Shift") {
                this.phaseShiftDuration = module.duration;
                Game.send("phaseShift", player.sid, module.duration);
            }

            Game.send("updateAbilityDisplay", 1, module.duration, module.reload);
        } else if (id <= this.abilities.length) {
            let ability = this.abilities[id - 1];

            if (!ability.durationTimer && !ability.reloadTimer) {
                ability.init(player, this);
                ability.durationTimer = ability.duration;

                if (ability.durationTimer <= 0) {
                    ability.reloadTimer = ability.reload;
                }

                Game.send("updateAbilityDisplay", id - 1, ability.duration, ability.reload);
            }
        }
    }
}