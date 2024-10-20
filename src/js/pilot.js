export default class {
    constructor(data, ownerSID) {
        this.level = 1;
        this.tier = data.tier;
        this.name = data.name;
        this.owner = ownerSID;
        this.description = data.description;
        this.maxSkills = data.maxSkills;
        this.imageSource = data.imageSource;
        this.cost = data.cost;
        this.skills = [];
    }
}