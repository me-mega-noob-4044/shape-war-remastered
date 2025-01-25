export default class Module {
    constructor(data, ownerSID, slot) {
        this.typeOfObj = "module";
        this.tier = data.tier;
        this.name = data.name;
        this.owner = ownerSID;
        this.type = data.type;
        this.description = data.description;
        this.attributes = [...data.attributes];
        this.imageSource = data.imageSource;
        this.slot = slot;
        this.level = 1;
        this.healthIncrease = data.healthIncreaseData ? data.healthIncreaseData.base : data.healthIncrease;
        this.cost = { ...data.cost };
    }
}