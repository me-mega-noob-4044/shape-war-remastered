import droneAbility from "../js/drone-ability.js";
import Player from "./player.js";
import Shape from "./shape.js";
import * as UTILS from "./utils.js";

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

        // this.vel = { x: 0, y: 0 };

        this.active = false;
        this.sid = -1;
        this.zIndex = -1;

        this.level = 1;
        this.tier = data.tier;
        this.name = data.name;
        this.description = data.description;
        this.industryName = data.industryName;

        /** @type {{ name: string, color: string, scale: number }} */

        this.visualData = { ...data.visualData };

        /** @type {Shape | number} */

        this.owner = ownerSID;

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
        this.dir += .002 * delta;

        let positionScale = this.owner.scale + (this.visualData.scale * 2) + 15;

        this.x = this.owner.x + Math.cos(this.dir) * positionScale;
        this.y = this.owner.y + Math.sin(this.dir) * positionScale;
    }

    /**
     * Update function for health base drone abilities
     * 
     * @param {number} value - Amount of health loss or gain
     */

    health(value) {
        // 
    }

    /**
     * @param {Player} player 
     */

    static activateDrones(player) {
        let chooseIndex = player.chooseIndex;

        for (let i = 0; i < player.shapes.length; i++) {
            let shape = player.shapes[i];

            if (i == chooseIndex) {
                if (shape.drone) shape.drone.active = true;
            } else {
                if (shape.drone) shape.drone.active = false;
            }
        }
    }
}