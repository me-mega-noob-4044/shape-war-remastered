import droneAbility from "../js/drone-ability.js";

export default class Drone {
    constructor(data, ownerSID) {
        this.level = 1;
        this.tier = data.tier;
        this.name = data.name;
        this.description = data.description;
        this.industryName = data.industryName;
        this.visualData = { ...data.visualData };
        this.owner = ownerSID;
        this.cost = data.cost;
        this.maxlevel = data.maxlevel;

        /** @type {droneAbility[]} */

        this.abilities = [];

        if (data.abilities.length) {
            for (let i = 0; i < data.abilities.length; i++) {
                let ability = data.abilities[i];

                this.abilities.push(new droneAbility(ability));
            }
        }
    }
}