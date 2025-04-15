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
        this.requirement = data.requirement;

        /** @type {number} */

        this.withIn = data.withIn;
        this.lastDate = 0;

        /** @type {number[]} */

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

    isReloaded() {
        return this.reload <= 0;
    }

    isValid() {
        return this.count >= this.requirement;
    }

    updateCount(value) {
        if (this.withIn <= 0) {
            this.count += value;
            return;
        }

        if (Date.now() - this.lastDate >= this.withIn) {
            this.lastDate = Date.now();
            this.count = 0;
        }

        this.count += value;
    }
}