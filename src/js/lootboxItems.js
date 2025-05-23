
class Item {

    /**
     * @param {string} name 
     * @param {string} type 
     * @param {number} amount 
     * @param {number} chance 
     */

    constructor(name, type, amount, chance) {
        this.name = name;
        this.type = type;
        this.amount = amount;
        this.chance = chance;

        this.normalized = 0;
    }
}

/**
 * @param {Item[]} items 
 */

function normalizeChances(items) {
    const total = items.map((a, b) => a.chance + b, 0);

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        item.normalized = item.chance / total;
    }
}

const lootboxItems = {

    /** @type {Item[]} */

    basic: [],

    /** @type {Item[]} */

    intermediate: [],

    /** @type {Item[]} */

    master: [],

    /** @type {Item[]} */

    champion: []
};

normalizeChances(lootboxItems.basic);
normalizeChances(lootboxItems.intermediate);
normalizeChances(lootboxItems.master);
normalizeChances(lootboxItems.champion);

console.log(lootboxItems);

export default lootboxItems;