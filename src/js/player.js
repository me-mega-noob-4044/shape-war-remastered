import items from "./items.js";
import shape from "./shape.js";
import config from "./config.js";
import weapon from "./weapon.js";
import module from "./module.js";
import * as UTILS from "./utils.js";
import Pathfinder from "../../client/src/game/pathfinding.js";
import Game, { drones, updatePlayerDisplay } from "../../client/src/main.js";
import Shape from "./shape.js";
import GameObject from "../../client/src/game/GameObject.js";
import { Map } from "../../client/src/game/mapBuilder.js";
import Weapon from "./weapon.js";
import Drone from "./drone.js";
import Module from "./module.js";
import Skill from "./skill.js";

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

class UpgraderManager {
    static upgradeShape(shape) {
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

    static upgradeWeapon(weapon) {
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

    static upgradeModule(module) {
        let item = items.modules.find(e => e.name == module.name);

        if (item.healthIncreaseData) {
            module.healthIncrease += item.healthIncreaseData.level[module.level];
        }

        if (item.dmgIncreaseData) {
            module.dmgIncrease += item.dmgIncreaseData.level[module.level];
        }

        module.level++;
    }

    static upgradeDrone(drone) {
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
}

function setBonuses(shape, skills) {
    let bonuses = {
        healthIncrease: 1,
        dmgIncrease: 1,
        speedIncrease: 1
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

    shape.speed *= bonuses.speedIncrease;
    shape.maxhealth = shape.health = Math.ceil(shape.health * bonuses.healthIncrease);

    for (let i = 0; i < shape.weapons.length; i++) {
        let wpn = shape.weapons[i];

        wpn.dmg *= bonuses.dmgIncrease;
    }
}

/**
 * @param {Shape} shape 
 * @param {boolean} easyMode 
 */

function playerify(shape, easyMode) {
    shape.x = 0;
    shape.y = 0;
    shape.dir = 0;
    shape.grayDamage = 0;
    shape.vel = { x: 0, y: 0 };

    if (easyMode) {
        shape.health = shape.maxhealth *= .15;
    }

    shape.grayDamage = 0;

    delete shape.cost;
    delete shape.weaponHardpoints;
    delete shape.moduleHardpoints;
    delete shape.description;

    for (let i = 0; i < shape.weapons.length; i++) {
        let wpn = shape.weapons[i];

        wpn.fireRateTimer = 0;

        if (easyMode) {
            wpn.dmg *= .125;
        }

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

function randIntCoords(e) {
    return UTILS.randInt(e - 300, e + 300);
}

export default class Player {

    /**
     * @param {*} data 
     * @param {string | boolean} isUser 
     * @param {Game} Game 
     * @param {number} indx 
     * @param {number} leaguePoints 
     */

    constructor(data, isUser, Game, indx, leaguePoints) {
        this.Game = Game;
        this.isUser = isUser;
        this.indx = indx;
        this.sid = indx;

        this.pathData = null;
        this.pathId = null;
        this.pathType = "";

        /** @type {boolean} */

        this.isAlly = !!isUser;

        this.isAttacking = 0;
        this.chooseIndex = isUser == "me" ? -1 : 0;
        this.mothershipCharge = 0;
        this.moveDir = undefined;
        this.reloadAllWeapons = false;

        /** @type {Shape[]} */

        this.shapes = [];

        /**
         * This is for bots
         * @type {boolean}
         */

        this.initDrone = false;

        this.mouseDistance = 0;

        this.targetDir = 0;

        this.vel = 0;

        this.stats = {
            dmg: 0,
            kills: 0,
            beacons: 0
        };

        this.init(data, leaguePoints);
    }

    /**
     * 
     * @param {{ drone: { name: string, level: number }, level: number, modules: Module[], name: string, sid: number, skills: Skill[], slot: number, weapons: Weapon[] }[]} Data 
     * @param {number} leaguePoints 
     */

    init(Data, leaguePoints = 0) {
        let easyMode = false;

        if (this.isUser != "me" && leaguePoints < config.easyModePoints) {
            easyMode = true;
        }

        for (let i = 0; i < Data.length; i++) {
            let data = Data[i];

            let Shape = new shape(items.shapes.find(e => e.name == data.name), data.slot, true);

            for (let i = 0; i < data.level - 1; i++) {
                UpgraderManager.upgradeShape(Shape);
            }

            Shape.activeModuleIndex = data.activeModuleIndex;
            Shape.weapons = [];

            for (let i = 0; i < data.weapons.length; i++) {
                let wpn = data.weapons[i];

                let Item = new weapon(items.weapons.find(e => e.name == wpn.name), undefined, wpn.slot);

                for (let t = 0; t < wpn.level - 1; t++) {
                    UpgraderManager.upgradeWeapon(Item);
                }

                Shape.weapons.push(Item);
            }

            Shape.weapons = Shape.weapons.sort((a, b) => a.slot - b.slot);

            Shape.modules = [];

            for (let i = 0; i < data.modules.length; i++) {
                let Module = data.modules[i];

                let Item = new module(items.modules.find(e => e.name == Module.name));

                for (let t = 0; t < Module.level - 1; t++) {
                    UpgraderManager.upgradeModule(Item);
                }

                Shape.modules.push(Item);
            }

            if (data.drone) {
                let drone = new Drone(items.drones.find(e => e.name == data.drone.name), Shape);

                for (let t = 0; t < data.drone.level - 1; t++) {
                    UpgraderManager.upgradeDrone(drone);
                }

                Shape.drone = drone;
                drones.push(drone);
            }

            setBonuses(Shape, data.skills);
            playerify(Shape, easyMode);

            this.shapes.push(Shape);
        }
    }

    /**
     * @param {Shape} shape - Victim
     * @param {number} value - The amount of health change (positive for healing and negative for damage)
     * @param {Player} doer - The object that is responible for dealing damage to the ``shape`` object
     * @param {string} weaponName - Name of the weapon that is damaging the ``shape`` object
     * @param {number} weaponLevel - Level of the weapon that is damaging the ``shape`` object
     */

    changeHealth(shape, value, doer, weaponName, weaponLevel) {
        if (shape.health > 0) {
            if (shape.isPhaseShift()) return; // Ignore health changes during phase shift (prevents healing during phasing)

            if (value <= 0) {
                shape.grayDamage += Math.abs(value * .4);

                if (doer) {
                    doer.stats.dmg += Math.abs(value);
                }
            } else {

                // Healing is count as damage

                this.stats.dmg += Math.abs(value);
            }

            if (shape.drone) shape.drone.health(value);
            shape.health += value;
            if (shape.health >= (shape.maxhealth - shape.grayDamage)) shape.health = shape.maxhealth - shape.grayDamage;

            if (doer && doer.isUser == "me") { // ) || this.isUser == "me"
                if (value < 0) {
                    this.Game.send("damageIndicators", this.sid, "normal", Math.abs(value));
                }
            }

            if (shape.health <= 0) {
                if (doer) {
                    doer.stats.kills++;

                    if (doer.isUser == "me") {
                        this.Game.send("killAnnouncement", doer.stats.kills);
                    }
                }
            }
        }
    }

    /**
     * @param {Shape} shape 
     * @param {GameObject[]} buildings 
     */

    handleMovement(shape, buildings) {
        let delta = config.gameUpdateSpeed;

        if (this.moveDir != undefined && !shape.avoidBuildings) {
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

            if (!shape.avoidBuildings) for (let i = 0; i < buildings.length; i++) {
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
            shape.vel.x *= Math.pow(shape.avoidBuildings ? config.skyPlayerDecel : config.playerDecel, config.gameUpdateSpeed);
            if (shape.vel.x <= 0.01 && shape.vel.x >= -0.01) shape.vel.x = 0;
        }
        if (shape.vel.y) {
            shape.vel.y *= Math.pow(shape.avoidBuildings ? config.skyPlayerDecel : config.playerDecel, config.gameUpdateSpeed);
            if (shape.vel.y <= 0.01 && shape.vel.y >= -0.01) shape.vel.y = 0;
        }
    }

    /**
     * @param {Shape} shape 
     * @param {Map} map 
     */

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

    /**
     * @param {Shape} shape 
     */

    updateDir(shape) {
        if (shape.dir != this.targetDir) {
            shape.dir %= PI2;

            let netAngle = (shape.dir - this.targetDir + PI2) % PI2;
            let amnt = Math.min(Math.abs(netAngle - PI2), netAngle, shape.aimTurnSpeed * config.gameUpdateSpeed);
            let sign = (netAngle - Math.PI) >= 0 ? 1 : -1;

            shape.dir += sign * amnt + PI2;
        }

        shape.dir %= PI2;
    }

    /**
     * @param {Player} player 
     * @returns {number | undefined}
     */

    movePathfind(player) {
        let nearestDistance = Infinity;
        this.pathIndx = Infinity;

        for (let i = 0; i < this.pathData.length; i++) {
            let data = this.pathData[i];
            let tmpDistance = UTILS.getDistance(data, player);

            if (tmpDistance <= nearestDistance) {
                this.pathIndx = i;
                nearestDistance = tmpDistance;
            }
        }

        this.pathIndx++;

        let tmp = this.pathData[this.pathIndx];

        if (tmp && player) {
            return UTILS.getDirection(tmp, player);
        } else {
            return undefined;
        }
    }

    /**
     * @param {Shape} shape 
     * @param {Map} map 
     * @param {GameObject[]} buildings 
     */

    aiMovement(shape, map, buildings) {
        this.moveDir = undefined;

        let nearestBeacon = buildings
            .filter(e => e.name == "beacon" && (this.isAlly ? e.capturePoints < 6e3 : e.capturePoints > -6e3))
            .sort((a, b) => UTILS.getDistance(a, shape) - UTILS.getDistance(b, shape))[0];

        if (nearestBeacon && UTILS.getDistance(nearestBeacon, shape) > 300) {
            let found = false;

            for (let i = 0; i < buildings.length; i++) {
                let tmpObj = buildings[i];

                if (tmpObj.name == "wall") {
                    if (UTILS.lineInRect(
                        tmpObj.x,
                        tmpObj.y,
                        tmpObj.x + tmpObj.width,
                        tmpObj.y + tmpObj.height,
                        shape.x,
                        shape.y,
                        nearestBeacon.x,
                        nearestBeacon.y
                    )) {
                        found = true;
                        break;
                    }
                }
            }

            if (!found) { // If bot can go path striagt then do so (ignore grammar and spelling)
                this.moveDir = UTILS.getDirection(nearestBeacon, shape);
            } else if (this.pathType == `beacon${nearestBeacon.sid}`) {
                if (this.pathData) {
                    this.moveDir = this.movePathfind(shape);
                } else {
                    this.moveDir = UTILS.getDirection(nearestBeacon, shape);
                }
            } else {
                let id = Pathfinder.search(shape, nearestBeacon, {
                    map
                });

                this.pathData = null;
                this.pathId = id;
                this.pathType = `beacon${nearestBeacon.sid}`;
            }
        }
    }

    /**
     * @param {Shape} shape 
     * @param {Shape | GameObject | object} target 
     * @param {GameObject[]} buildings 
     * @returns {boolean}
     */

    canHit(shape, target, buildings) {
        for (let i = 0; i < buildings.length; i++) {
            let tmpObj = buildings[i];

            if (tmpObj.name == "wall") {
                if (UTILS.lineInRect(
                    tmpObj.x,
                    tmpObj.y,
                    tmpObj.x + tmpObj.width,
                    tmpObj.y + tmpObj.height,
                    shape.x,
                    shape.y,
                    target.x,
                    target.y)
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    aiWeaponFire(shape, buildings, players) {
        if (this.isUser == "me") return;

        let possibleTargets = [];

        for (let i = 0; i < players.length; i++) {
            let player = players[i];
            let shape = player.shapes[player.chooseIndex];

            if (shape && player.isAlly != this.isAlly) {
                possibleTargets.push(shape);
            }
        }

        let target = possibleTargets.filter(e => e.health > 0 && this.canHit(shape, e, buildings)).sort((a, b) => UTILS.getDistance(a, shape) - UTILS.getDistance(b, shape))[0];

        if (target) {
            let shortestWeapon = shape.weapons.sort((a, b) => a.range - b.range)[0];

            if (UTILS.getDistance(target, shape) <= shortestWeapon.range) {
                let dir = UTILS.getDirection(target, shape);

                this.targetDir = dir;
                this.target = target;
                this.isAttacking = 1;
            } else {
                this.target = null;
                this.isAttacking = 0;
            }
        } else {
            this.target = null;
            this.isAttacking = 0;
        }
    }

    doActiveModuleEffects(shape, delta) {
        if (shape.activeModuleRegen && shape.activeModuleRegen.duration > 0) {
            shape.activeModuleRegen.duration -= delta;
            shape.activeModuleRegen.rate -= delta;

            if (shape.activeModuleRegen.rate <= 0) {
                shape.activeModuleRegen.rate = shape.activeModuleRegen.maxRate;
                this.changeHealth(shape, shape.maxhealth * shape.activeModuleRegen.power);
            }

            if (shape.activeModuleRegen.duration <= 0) shape.activeModuleRegen.duration = 0;
        }
    }

    /**
     * @param {Shape} shape 
     * @param {Map} map 
     * @param {GameObject[]} buildings 
     * @param {Player[]} players 
     */

    update(shape, map, buildings, players) {
        this.updateDir(shape);

        if (this.isUser != "me") {
            if (!this.initDrone) {
                Drone.activateDrones(this);
                this.initDrone = true;
            }

            this.aiMovement(shape, map, buildings);
        }

        this.handleMovement(shape, buildings);
        this.handleBorder(shape, map);

        this.aiWeaponFire(shape, buildings, players);

        this.manageWeapons(shape);

        for (let i = 0; i < shape.abilities.length; i++) {
            shape.abilities[i].update(this, shape, config.gameUpdateSpeed);
        }

        this.doActiveModuleEffects(shape, config.gameUpdateSpeed);

        if (shape.health > shape.maxhealth - shape.grayDamage) {
            shape.health = shape.maxhealth - shape.grayDamage;
        }

        shape.zIndex = !!shape.avoidBuildings * 1;

        shape.manageEffects(config.gameUpdateSpeed);

        if (shape.health <= 0) {
            if (this.indx == 0) {
                this.chooseIndex = -1;

                this.Game.send("chooseSlot");
            } else {
                this.chooseIndex++;

                let shape = this.shapes[this.chooseIndex];

                if (shape) {
                    this.pathData = null;
                    this.pathId = -1;
                    this.pathType = "";

                    Drone.activateDrones(this);

                    if (this.isAlly) {
                        shape.x = randIntCoords(this.Game.map.locations[this.Game.spawnIndx].x);
                        shape.y = randIntCoords(this.Game.map.locations[this.Game.spawnIndx].y);
                    } else {
                        shape.x = randIntCoords(this.Game.map.locations[+!this.Game.spawnIndx].x);
                        shape.y = randIntCoords(this.Game.map.locations[+!this.Game.spawnIndx].y);
                    }
                }
            }

            this.moveDir = undefined;
            updatePlayerDisplay();
            this.Game.send("removePlayer", this.sid);
        }
    }

    /**
     * 
     * @param {Shape} shape 
     * @param {number} slot 
     * @param {Weapon} wpn 
     * @param {number} hardpoints 
     */

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

        if (this.isUser == "me") {
            let loc = {
                x: shape.x + Math.cos(shape.dir) * this.mouseDistance,
                y: shape.y + Math.sin(shape.dir) * this.mouseDistance
            };

            dir = UTILS.getDirection(loc, { x: x, y: y });
        } else if (this.target) {
            let distance = UTILS.getDistance(shape, this.target);
            let loc = {
                x: shape.x + Math.cos(shape.dir) * distance,
                y: shape.y + Math.sin(shape.dir) * distance
            };

            dir = UTILS.getDirection(loc, { x: x, y: y });
        }

        const originalDirection = dir;

        for (let i = 0; i < wpn.projectilesFired; i++) {
            let dir = originalDirection;
            if (wpn.spread) dir += UTILS.randDirectionSpread(wpn.spread);

            this.Game.addProjectile(x, y, dir, this.indx, wpn, this.vel);
        }
    }

    /**
     * @param {Shape} shape 
     */

    manageWeapons(shape) {
        let game = this.Game;
        let fired = [];

        if (shape.isPhaseShift()) return;

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
                    if (wpn.reloaded && this.isUser == "me") {
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

        if (fired.length && this.isUser == "me") {
            game.send("updateWeapons", fired);
        }
    }
}