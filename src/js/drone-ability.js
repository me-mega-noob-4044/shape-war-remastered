export default class {
    constructor(data) {
        this.name = data.name;
        this.description = (data.description || "No description.");
        this.attributes = [ ...data.attributes ];
        this.statIcons = [ ...data.statIcons ];
        this.statTitles = [ ...data.statTitles ];
        this.reload = (data.reload || 0);

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