import items from "./items.js";
import shape from "./shape.js";
import config from "./config.js";
import weapon from "./weapon.js";

function getMk3Amount(tmp) {
    let maxNumber = tmp.base;
    for (let i = 0; i < tmp.level.length; i++) {
        maxNumber += tmp.level[i];
    }
    let mk3Increase = maxNumber * config.mk3EnchantmentIncrease;

    return mk3Increase;
}

function getMk2Amount(tmpObj, tmp, type) {
    let item = items.shapes.find(e => e.name == tmpObj.name);
    if (type == "weapon") {
        item = items.weapons.find(e => e.name == tmpObj.name);
    } else if (type == "module") {
        item = items.modules.find(e => e.name == tmpObj.name);
    }

    let maxNumber = tmp.base;
    for (let i = 0; i < tmp.level.length; i++) {
        maxNumber += tmp.level[i];
    }
    let mk2Increase = maxNumber * item.mk2DataIncrease;
    let total = mk2Increase - maxNumber;

    if (tmpObj.level == 24) {
        return 0;
    }

    return total / 11;
}

var upgraderManager = new class {
    upgradeShape(shape) {
        let item = items.shapes.find(e => e.name == shape.name);
        if (item.healthData) {
            let value = item.healthData.level[shape.level];
            if (shape.level >= 24) {
                if (shape.level == 24) {
                    shape.health += getMk3Amount(item.healthData);
                }
            } else if (shape.level > 12) {
                shape.health += getMk2Amount(shape, item.healthData);
            } else if (value) {
                shape.health += value;
            }
        }
        if (item.speedData) {
            let value = item.speedData.level[shape.level];
            if (value) {
                shape.speed += value;
            }
        }
        shape.level++;
    }
    upgradeWeapon(weapon) {
        let item = items.weapons.find(e => e.name == weapon.name);
        if (item.damageData) {
            let value = item.damageData.level[weapon.level];
            if (weapon.level >= 24) {
                if (weapon.level == 24) {
                    weapon.dmg += getMk3Amount(item.damageData);
                }
            } else if (weapon.level > 12) {
                weapon.dmg += getMk2Amount(weapon, item.damageData, "weapon");
            } else if (value) {
                weapon.dmg += value;
            }
        }

        weapon.level++;
    }
    upgradeModule(module) {
        let item = items.modules.find(e => e.name == module.name);
        if (item.healthIncreaseData) {
            module.healthIncrease += item.healthIncreaseData.level[module.level];
        }

        module.level++;
    }
    upgradeDrone(drone) {
        let item = items.drones.find(e => e.name == drone.name);

        for (let i = 0; i < drone.abilities.length; i++) {
            let ability = drone.abilities[i];
            let abilityItem = item.abilities[i]

            for (let t = 0; t < abilityItem.stats.length; t++) {
                let stat = abilityItem.stats[t];

                if (typeof stat == "object") {
                    let increase = stat.level[drone.level];

                    if (increase) {
                        ability.stats[t] += increase;
                    }
                }
            }
        }

        drone.level++;
    }
};

export default class {
    constructor(data) {
        this.mothershipCharge = 0;
        this.shapes = [];

        this.init(data);
    }

    init(Data) {
        for (let i = 0; i < Data.length; i++) {
            let data = Data[i];

            let Shape = new shape(items.shapes.find(e => e.name == data.name), data.slot, true);

            for (let i = 0; i < data.level - 1; i++) {
                upgraderManager.upgradeShape(Shape);
            }

            Shape.weapons = [];

            for (let i = 0; i < data.weapons.length; i++) {
                let wpn = data.weapons[i];
            }

            console.log(data, Shape);
        }
    }
}