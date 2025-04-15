import droneAbility from "../js/drone-ability.js";
import Player from "./player.js";
import Shape from "./shape.js";
import * as UTILS from "./utils.js";

/*
ABILTIES GUIDE:
    On Mild Damage: Fix
        0: Repair power
*/

const countDamageTaken = ["On Mild Damage: Fix"];

export default class Drone {

    /**
     * @param {object} data 
     * @param {Shape | number} ownerSID 
     */

    constructor(data, ownerSID) {
        this.x = 0;
        this.y = 0;

        this.dt = 0;

        this.x1 = 0;
        this.y1 = 0;
        this.x2 = 0;
        this.y2 = 0;

        this.active = false;
        this.sid = -1;
        this.zIndex = -1;

        this.forcePosition = false;

        this.level = 1;
        this.tier = data.tier;
        this.name = data.name;
        this.description = data.description;
        this.industryName = data.industryName;

        /** @type {{ name: string, color: string, scale: number }} */

        this.visualData = { ...data.visualData };

        /** @type {Shape | number} */

        this.owner = ownerSID;

        /** @type {Player | null} */

        this.ownerParent = null;

        this.cost = data.cost;
        this.maxlevel = data.maxlevel;

        /** @type {droneAbility[]} */

        this.abilities = [];

        this.dir = UTILS.randFloat(-Math.PI, Math.PI);

        if (data.abilities.length) {
            for (let i = 0; i < data.abilities.length; i++) {
                let ability = data.abilities[i];

                this.abilities.push(new droneAbility(ability));
            }
        }
    }

    /**
     * @param {number} delta 
     */

    update(delta) {
        this.dir += .0022 * delta;

        let positionScale = this.owner.scale + (this.visualData.scale * 2) + 15;

        this.x = this.owner.x + Math.cos(this.dir) * positionScale;
        this.y = this.owner.y + Math.sin(this.dir) * positionScale;

        this.updateAbilities(delta);
    }

    /**
     * The actual function that handles the effects of the abilities
     */

    updateAbilities(delta) {
        for (let i = 0; i < this.abilities.length; i++) {
            let ability = this.abilities[i];

            if (ability) {
                if (ability.isReloaded() && ability.isValid()) {
                    if (ability.name == "On Mild Damage: Fix") {
                        this.ownerParent.changeHealth(this.owner, ability.stats[0]);
                    }

                    ability.count = 0;
                    ability.reload = ability.maxReload;
                } else if (!ability.isReloaded()) {
                    ability.reload -= delta;
                    if (ability.reload <= 0) ability.reload = 0;
                }
            }
        }
    }

    /**
     * Update function for health base drone abilities
     * 
     * @param {number} value - Amount of health loss or gain
     */

    health(value) {
        if (value < 0) {
            // Taking damage counter

            for (let i = 0; i < this.abilities.length; i++) {
                let ability = this.abilities[i];

                if (ability && countDamageTaken.includes(ability.name) && ability.isReloaded()) {
                    ability.updateCount(Math.abs(value));
                }
            }
        } else {
            // Repair counter
        }
    }

    /**
     * @param {Player} player 
     */

    static activateDrones(player) {
        let chooseIndex = player.chooseIndex;

        for (let i = 0; i < player.shapes.length; i++) {
            let shape = player.shapes[i];

            if (i == chooseIndex) {
                if (shape.drone) {
                    shape.drone.ownerParent = player;
                    shape.drone.active = true;
                }
            } else {
                if (shape.drone) {
                    shape.drone.ownerParent = player;
                    shape.drone.active = false;
                }
            }
        }
    }
}