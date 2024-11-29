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
    shape.health = shape.maxhealth / 2;

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

var PI2 = Math.PI * 2;

export default class {
    constructor(data, isUser, Game, indx) {
        this.Game = Game;
        this.isUser = isUser;
        this.indx = indx;

        this.isAlly = !!isUser;

        this.isAttacking = 0;
        this.chooseIndex = -1;
        this.mothershipCharge = 0;
        this.moveDir = undefined;
        this.reloadAllWeapons = false;
        this.shapes = [];

        this.mouseDistance = 0;

        this.targetDir = 0;

        this.vel = 0;

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

    changeHealth(shape, value) {
        shape.health += value;
    }

    handleMovement(shape, buildings) {
        let delta = config.gameUpdateSpeed;

        if (this.moveDir != undefined) {
            shape.vel.x += Math.cos(this.moveDir) * shape.speed * config.gameUpdateSpeed;
            shape.vel.y += Math.sin(this.moveDir) * shape.speed * config.gameUpdateSpeed;
        }
        
        let tmpSpeed = UTILS.getDistance({ x: 0, y: 0 }, { x: shape.vel.x * delta, y: shape.vel.y * delta });
		let depth = Math.min(4, Math.max(1, Math.round(tmpSpeed / 40)));
		let tMlt = 1 / depth;

        let x = shape.x, y = shape.y;
        shape.lastX = x;
        shape.lastY = y;

		for (let i = 0; i < depth; i++) {
            if (shape.vel.x) shape.x += shape.vel.x * delta * tMlt;
            if (shape.vel.y) shape.y += shape.vel.y * delta * tMlt;

            for (let i = 0; i < buildings.length; i++) {
                let tmpObj = buildings[i];
    
                if (tmpObj) {
                    if (tmpObj.name == "wall") {
                        if (shape.x >= tmpObj.x - shape.scale && shape.x <= tmpObj.x + tmpObj.width + shape.scale) {
                            if (shape.y >= tmpObj.y - shape.scale && shape.y <= tmpObj.y + tmpObj.height + shape.scale) {
                                let Px = Math.max(tmpObj.x + shape.scale, Math.min(shape.x, tmpObj.x + tmpObj.width - shape.scale));
                                let Py = Math.max(tmpObj.y + shape.scale, Math.min(shape.y, tmpObj.y + tmpObj.height - shape.scale));
    
                                if (UTILS.getDistance({ x: Px, y: Py }, shape) <= shape.scale * 2) {
                                    let angle = UTILS.getDirection(shape, { x: Px, y: Py });
    
                                    shape.x = Px + Math.cos(angle) * shape.scale * 2;
                                    shape.y = Py + Math.sin(angle) * shape.scale * 2;
                                    shape.vel.x *= .75;
                                    shape.vel.y *= .75;
                                }
                            }
                        }
                    } else if (tmpObj.name == "healing beacon") {
                        if (UTILS.getDistance(shape, tmpObj) < shape.scale + 60) {
                            let angle = UTILS.getDirection(shape, tmpObj);
                            let tmp = {
                                x: tmpObj.x + Math.cos(angle) * (shape.scale + 61),
                                y: tmpObj.y + Math.sin(angle) * (shape.scale + 61)
                            };
    
                            shape.x = tmp.x;
                            shape.y = tmp.y;
                            shape.vel.x *= .75;
                            shape.vel.y *= .75;
                        }
                    }
                }
            }
        }

        this.vel = UTILS.getDistance({ x, y }, shape) / config.gameUpdateSpeed;

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

    updateDir(shape) {
        if (shape.dir != this.targetDir) {
            shape.dir %= PI2;

            let netAngle = (shape.dir - this.targetDir + PI2) % PI2;
            let amnt = Math.min(Math.abs(netAngle - PI2), netAngle, shape.aimTurnSpeed * config.gameUpdateSpeed);
            let sign = (netAngle - Math.PI) >=0 ? 1 : -1;

            shape.dir += sign * amnt + PI2;
        }

        shape.dir %= PI2;
    }

    handleBuildingCollisions(shape, buildings) {
        for (let i = 0; i < buildings.length; i++) {
            let tmpObj = buildings[i];

            if (tmpObj) {
                if (tmpObj.name == "beacon") {
                    if (UTILS.getDistance(shape, tmpObj) <= 400 + shape.scale) {
                        let tmpAdd = (this.isAlly ? 1 : -1);

                        tmpObj.capturePoints = Math[tmpAdd ? "min" : "max"](6e3, tmpObj.capturePoints + (tmpAdd * config.gameUpdateSpeed));

                        this.Game.send("beaconUpdate", i, tmpObj.capturePoints);
                    } else {
                        if (tmpObj.capturePoints != 0 && Math.abs(tmpObj.capturePoints) != 6e3) {
                            let wasNeg = tmpObj.capturePoints < 0 ? -1 : 1;

                            if (Math.abs(tmpObj.capturePoints) <= 60) {
                                tmpObj.capturePoints = 0;
                            } else {
                                tmpObj.capturePoints -= (6e3 / config.gameUpdateSpeed) * wasNeg * .25;
                            }
    
                            this.Game.send("beaconUpdate", i, tmpObj.capturePoints);
                        }
                    }
                }
            }
        }
    }

    update(shape, map, buildings) {
        this.updateDir(shape);

        this.handleMovement(shape, buildings);
        this.handleBorder(shape, map);

        this.handleBuildingCollisions(shape, buildings);

        this.manageWeapons(shape);

        if (shape.health > shape.maxhealth - shape.grayDamage) {
            shape.health = shape.maxhealth - shape.grayDamage;
        }
    }

    fireWeapon(shape, slot, wpn, hardpoints) {
        let x, y, dir = 0;

        let hScale = 20 / 2;

        if (hardpoints == 1) {
            x = shape.x + Math.cos(shape.dir) * (shape.scale - hScale);
            y = shape.y + Math.sin(shape.dir) * (shape.scale - hScale);
        } else if (hardpoints == 2) {
            if (slot == 0) {
                x = shape.x + Math.cos(shape.dir + 1.57) * (shape.scale - hScale);
                y = shape.y + Math.sin(shape.dir + 1.57) * (shape.scale - hScale);
            } else {
                x = shape.x + Math.cos(shape.dir - 1.57) * (shape.scale - hScale);
                y = shape.y + Math.sin(shape.dir - 1.57) * (shape.scale - hScale);
            }
        } else if (hardpoints == 3) {
            if (slot == 0) {
                x = shape.x + Math.cos(shape.dir + 1.57) * (shape.scale - hScale);
                y = shape.y + Math.sin(shape.dir + 1.57) * (shape.scale - hScale);
            } else if (slot == 1) {
                x = shape.x + Math.cos(shape.dir) * (shape.scale - hScale);
                y = shape.y + Math.sin(shape.dir) * (shape.scale - hScale);
            } else {
                x = shape.x + Math.cos(shape.dir - 1.57) * (shape.scale - hScale);
                y = shape.y + Math.sin(shape.dir - 1.57) * (shape.scale - hScale);
            }
        } else {
            if (slot == 0 || slot == 4) {
                x = shape.x + Math.cos(shape.dir + 1.57) * (shape.scale - 7.5);
                y = shape.y + Math.sin(shape.dir + 1.57) * (shape.scale - 7.5);
            } else if (slot == 1 || slot == 5) {
                x = shape.x + Math.cos(shape.dir + 0.39) * (shape.scale - 7.5);
                y = shape.y + Math.sin(shape.dir + 0.39) * (shape.scale - 7.5);
            } else if (slot == 2 || slot == 6) {
                x = shape.x + Math.cos(shape.dir - 0.39) * (shape.scale - 7.5);
                y = shape.y + Math.sin(shape.dir - 0.39) * (shape.scale - 7.5);
            } else {
                x = shape.x + Math.cos(shape.dir - 1.57) * (shape.scale - 7.5);
                y = shape.y + Math.sin(shape.dir - 1.57) * (shape.scale - 7.5);
            }
        }

        if (this.isUser) {
            let loc = {
                x: shape.x + Math.cos(shape.dir) * this.mouseDistance,
                y: shape.y + Math.sin(shape.dir) * this.mouseDistance
            };

            dir = UTILS.getDirection(loc, { x: x, y: y });
        }

        if (wpn.spread) dir += UTILS.randDirectionSpread(wpn.spread);

        this.Game.addProjectile(x, y, dir, this.indx, wpn, this.vel);
    }

    manageWeapons(shape) {
        let game = this.Game;
        let fired = [];

        for (let i = 0; i < shape.weapons.length; i++) {
            let wpn = shape.weapons[i];

            if (wpn) {
                if (wpn.ammo > 0 && wpn.reloaded) {
                    if (this.reloadAllWeapons) {
                        wpn.ammo = 0;
                        fired.push([i, 0]);
                    }

                    wpn.fireRateTimer -= config.gameUpdateSpeed;
                    if (wpn.fireRateTimer <= 0 && this.isAttacking) {
                        wpn.fireRateTimer = wpn.fireRate;
                        wpn.ammo--;
                        this.fireWeapon(shape, i, wpn, shape.weapons.length);

                        fired.push([i, wpn.ammo / wpn.maxammo]);
                    }
                } else {
                    if (wpn.reloaded) {
                        game.send("reloadWeapon", i, wpn.reload);
                    }

                    wpn.reloaded = false;

                    wpn.ammo += (wpn.maxammo / wpn.reload) * config.gameUpdateSpeed;
                    if (wpn.ammo > wpn.maxammo) {
                        wpn.ammo = wpn.maxammo;
                        wpn.reloaded = true;

                        fired.push([i, wpn.ammo / wpn.maxammo]);
                    }
                }
            }
        }

        this.reloadAllWeapons = false;

        if (fired.length) {
            game.send("updateWeapons", fired);
        }
    }
}