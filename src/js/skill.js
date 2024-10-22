export default class {
    constructor(data, slot) {
        this.tier = data.tier;
        this.name = data.name;
        this.description = data.description;
        this.slot = slot;
        this.main = data.main;
        this.imageSource = data.imageSource;
        this.healthIncrease = data.healthIncrease;
        this.dmgIncrease = data.dmgIncrease;
    }
}