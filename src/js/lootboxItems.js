export class LootboxItem {

    /**
     * @param {string} name 
     * @param {"money" | "shape" | "weapon" | "module" | "drone"} type 
     * @param {number} amount 
     * @param {number} weight - Out of 100. This value is based on percentages (for example 50 -> 50%).
     */

    constructor(name, type, amount, weight) {
        this.name = name;
        this.type = type;
        this.amount = amount;
        this.weight = weight;

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
        new LootboxItem("gold", "money", 10, 80),
        new LootboxItem("gold", "money", 5, 80),
        new LootboxItem("gold", "money", 7, 80),
        new LootboxItem("gold", "money", 15, 80),

        new LootboxItem("silver", "money", 15e3, 80),
        new LootboxItem("silver", "money", 5e3, 80),
        new LootboxItem("silver", "money", 2e3, 80),

        new LootboxItem("keys", "money", 7, 80),
        new LootboxItem("keys", "money", 5, 80),
        new LootboxItem("keys", "money", 2, 80),
        new LootboxItem("keys", "money", 10, 80),
        new LootboxItem("keys", "money", 10, 15)
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