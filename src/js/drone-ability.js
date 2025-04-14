export default class droneAbility {
    constructor(data) {
        this.name = data.name;
        this.description = (data.description || "No description.");
        this.attributes = [...data.attributes];
        this.statIcons = [...data.statIcons];
        this.statTitles = [...data.statTitles];

        /**
         * Used for storing values for ability functions such as health loss, health repaired, and damage dealt.
         * 
         * @type {number}
         */

        this.count = 0;

        this.reload = 0;
        this.maxReload = (data.reload || 0);

        this.stats = [];

        for (let i = 0; i < data.stats.length; i++) {
            let stat = data.stats[i];

            if (typeof stat == "object") {
                this.stats.push(stat.base);
            } else {
                this.stats.push(stat);
            }
        }
    }
}