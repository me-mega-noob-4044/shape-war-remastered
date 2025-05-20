export default class Weapon {
    constructor(data, ownerSID, slot) {
        this.typeOfObj = "weapon";

        /** @type {number} */

        this.tier = data.tier;

        this.owner = ownerSID;
        this.name = data.name;
        this.slot = slot;
        this.level = 1;

        /** @type {number} */

        this.spread = data.spread;

        this.industryName = data.industryName;
        this.description = data.description;
        this.type = data.type;
        this.attributes = [...data.attributes];

        /** @type {number} */

        this.ammo = this.maxammo = data.ammo;


        /** @type {number} */

        this.mothershipChargeRate = data.mothershipChargeRate;

        /** @type {string} */

        this.imageSource = data.imageSource;

        /** @type {number} */

        this.dmg = data.damageData?.base || data.dmg;

        /** @type {number} */

        this.reload = data.reload;

        /** @type {number} */

        this.fireRate = data.fireRate;

        this.reloaded = true;

        /** @type {number} */

        this.projectileId = data.projectileId;

        /** @type {number} */

        this.range = data.range;

        /** @type {number} */

        this.projectilesFired = data.projectilesFired || 1;
        this.cost = { ...data.cost };
    }
}