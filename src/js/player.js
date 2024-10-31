import items from "./items.js";
import shape from "./shape.js";
import config from "./config.js";
import weapon from "./weapon.js";
import module from "./module.js";
import * as UTILS from "./utils.js";

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

            shape.maxhealth = shape.health;
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

function setBonuses(shape, skills) {
    let bonuses = {
        healthIncrease: 1,
        dmgIncrease: 1
    };

    for (let i = 0; i < skills.length; i++) {
        let skill = items.skills.find(e => e.name == skills[i]);

        for (let key in bonuses) {
            if (skill[key]) {
                bonuses[key] += skill[key];
            }
        }
    }

    for (let i = 0; i < shape.modules.length; i++) {
        let mod = shape.modules[i];

        for (let key in bonuses) {
            if (mod[key]) {
                bonuses[key] += mod[key];
            }
        }
    }

    shape.maxhealth = shape.health = Math.ceil(shape.health * bonuses.healthIncrease);

    for (let i = 0; i < shape.weapons.length; i++) {
        let wpn = shape.weapons[i];

        wpn.dmg *= bonuses.dmgIncrease;
    }
}

function playerify(shape) {
    shape.x = 0;
    shape.y = 0;
    shape.dir = 0;
    shape.grayDamage = 0;
    shape.vel = { x: 0, y: 0 };

    delete shape.cost;
    delete shape.weaponHardpoints;
    delete shape.moduleHardpoints;
    delete shape.description;

    for (let i = 0; i < shape.weapons.length; i++) {
        let wpn = shape.weapons[i];

        wpn.fireRateTimer = 0;
        delete wpn.cost;
        delete wpn.attributes;
        delete wpn.description;
        delete wpn.owner;
        delete wpn.industryName;
        delete wpn.type;
    }

    for (let i = 0; i < shape.modules.length; i++) {
        let mod = shape.modules[i];

        delete mod.cost;
        delete mod.slot;
        delete mod.attributes;
        delete mod.description;
        delete mod.owner;
        delete mod.industryName;
        delete mod.type;
    }
}

export default class {
    constructor(data, isUser, Game) {
        this.Game = Game;
        this.isUser = isUser;
        this.isAttacking = 0;
        this.chooseIndex = -1;
        this.mothershipCharge = 0;
        this.moveDir = undefined;
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

                let Item = new weapon(items.weapons.find(e => e.name == wpn.name), undefined, wpn.slot);

                for (let t = 0; t < wpn.level - 1; t++) {
                    upgraderManager.upgradeWeapon(Item);
                }

                Shape.weapons.push(Item);
            }

            Shape.weapons = Shape.weapons.sort((a, b) => a.slot - b.slot);

            Shape.modules = [];

            for (let i = 0; i < data.modules.length; i++) {
                let Module = data.modules[i];

                let Item = new module(items.modules.find(e => e.name == Module.name));

                for (let t = 0; t < Module.level - 1; t++) {
                    upgraderManager.upgradeModule(Item);
                }

                Shape.modules.push(Item);
            }

            setBonuses(Shape, data.skills);
            playerify(Shape);

            this.shapes.push(Shape);
        }
    }

    handleMovement(shape) {
        let delta = config.gameUpdateSpeed;

        if (this.moveDir != undefined) {
            shape.vel.x += Math.cos(this.moveDir) * shape.speed * config.gameUpdateSpeed;
            shape.vel.y += Math.sin(this.moveDir) * shape.speed * config.gameUpdateSpeed;
        }
        
        let tmpSpeed = UTILS.getDistance({ x: 0, y: 0 }, { x: shape.vel.x * delta, y: shape.vel.y * delta });
		let depth = Math.min(4, Math.max(1, Math.round(tmpSpeed / 40)));
		let tMlt = 1 / depth;

		for (let i = 0; i < depth; i++) {
            if (shape.vel.x) shape.x += shape.vel.x * delta * tMlt;
            if (shape.vel.y) shape.y += shape.vel.y * delta * tMlt;
        }

        if (shape.vel.x) {
            shape.vel.x *= Math.pow(config.playerDecel, config.gameUpdateSpeed);
			if (shape.vel.x <= 0.01 && shape.vel.x >= -0.01) shape.vel.x = 0;
        }
        if (shape.vel.y) {
            shape.vel.y *= Math.pow(config.playerDecel, config.gameUpdateSpeed);
			if (shape.vel.y <= 0.01 && shape.vel.y >= -0.01) shape.vel.y = 0;
        }
    }

    handleBorder(shape, map) {
        if (shape.x <= shape.scale) {
            shape.x = shape.scale;
        }

        if (shape.x >= map.width - shape.scale) {
            shape.x = map.width - shape.scale;
        }

        if (shape.y <= shape.scale) {
            shape.y = shape.scale;
        }

        if (shape.y >= map.height - shape.scale) {
            shape.y = map.height - shape.scale;
        }
    }

    update(shape, map) {
        // Movement:

        this.handleMovement(shape);
        this.handleBorder(shape, map);

        this.manageWeapons(shape);
    }

    manageWeapons(shape) {
        let game = this.Game;
        let fired = [];

        for (let i = 0; i < shape.weapons.length; i++) {
            let wpn = shape.weapons[i];

            if (wpn) { // wpn.maxammo
                if (wpn.ammo > 0 && wpn.reloaded) {
                    wpn.fireRateTimer -= config.gameUpdateSpeed;
                    if (wpn.fireRateTimer <= 0 && this.isAttacking) {
                        wpn.fireRateTimer = wpn.fireRate;
                        wpn.ammo--;

                        fired.push([i, wpn.ammo / wpn.maxammo]);
                    }
                } else {
                    wpn.reloaded = false;

                    wpn.ammo += (wpn.maxammo / wpn.reload) * config.gameUpdateSpeed;
                    if (wpn.ammo > wpn.maxammo) {
                        wpn.ammo = wpn.maxammo;

                        fired.push([i, wpn.ammo / wpn.maxammo]);
                    }
                }
            }
        }

        if (fired.length) {
            game.send("updateWeapons", fired);
        }
    }
}