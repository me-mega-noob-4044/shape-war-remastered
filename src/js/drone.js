import droneAbility from "../js/drone-ability.js";
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
        this.vel = { x: 0, y: 0 };

        this.active = true;

        this.level = 1;
        this.tier = data.tier;
        this.name = data.name;
        this.description = data.description;
        this.industryName = data.industryName;
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

    update(delta) {

    }
}