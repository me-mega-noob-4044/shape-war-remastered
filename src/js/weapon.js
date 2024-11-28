export default class {
    constructor(data, ownerSID, slot) {
        this.typeOfObj = "weapon";
        this.tier = data.tier;
        this.owner = ownerSID;
        this.name = data.name;
        this.slot = slot;
        this.level = 1;
        this.spread = data.spread;
        this.industryName = data.industryName;
        this.description = data.description;
        this.type = data.type;
        this.attributes = [ ...data.attributes ];
        this.ammo = this.maxammo = data.ammo;
        this.mothershipChargeRate = data.mothershipChargeRate;
        this.imageSource = data.imageSource;
        this.dmg = data.damageData?.base || data.dmg;
        this.reload = data.reload;
        this.fireRate = data.fireRate;
        this.reloaded = true;
        this.projectileId = data.projectileId;
        this.range = data.range;
        this.cost = { ...data.cost };
    }
}