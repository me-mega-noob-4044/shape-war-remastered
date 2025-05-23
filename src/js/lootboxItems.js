export class LootboxItem {

    /**
     * @param {string} name 
     * @param {"money" | "shape" | "weapon" | "module" | "drone"} type 
     * @param {number} weight - Out of 100. This value is based on percentages (for example 50 -> 50%).
     * @param {number} amount 
     */

    constructor(name, type, weight, amount = 1) {
        this.name = name;
        this.type = type;
        this.weight = weight;
        this.amount = amount;

        this.normalized = 0;
    }

    /**
     * @param {LootboxItem[]} items 
     */

    static normalize(items) {
        const total = items.reduce((sum, item) => sum + item.weight, 0);

        for (const item of items) {
            item.normalized = item.weight / total;
        }
    }

    /**
     * @param {LootboxItem[]} items 
     * @returns {LootboxItem}
     */

    static drawItem(items) {
        const rand = Math.random();
        let cumulative = 0;

        for (const item of items) {
            cumulative += item.normalized;

            if (rand < cumulative) {
                return item;
            }
        }

        return null;
    }
}

// "gold" | "silver" | "platinum" | "keys" | "microchips" | "powercells"

const lootboxItems = {

    /** @type {LootboxItem[]} */

    basic: [
        new LootboxItem("gold", "money", 80, 10),
        new LootboxItem("gold", "money", 80, 5),
        new LootboxItem("gold", "money", 80, 7),
        new LootboxItem("gold", "money", 80, 15),

        new LootboxItem("silver", "money", 80, 15e3),
        new LootboxItem("silver", "money", 80, 5e3),
        new LootboxItem("silver", "money", 80, 2e3),

        new LootboxItem("keys", "money", 80, 7),
        new LootboxItem("keys", "money", 80, 5),
        new LootboxItem("keys", "money", 80, 2),
        new LootboxItem("keys", "money", 80, 10),
        new LootboxItem("keys", "money", 15, 10)
    ],

    /** @type {LootboxItem[]} */

    intermediate: [],

    /** @type {LootboxItem[]} */

    master: [],

    /** @type {LootboxItem[]} */

    champion: []
};

LootboxItem.normalize(lootboxItems.basic);
LootboxItem.normalize(lootboxItems.intermediate);
LootboxItem.normalize(lootboxItems.master);
LootboxItem.normalize(lootboxItems.champion);

export default lootboxItems;