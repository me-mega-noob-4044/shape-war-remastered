import msgpack from "../../src/js/msgpack.js";
import Player from "../../src/js/player.js";
import { MapBuilder, Map } from "./game/mapBuilder.js";
import config from "../../src/js/config.js";
import * as UTILS from "../../src/js/utils.js";
import items from "../../src/js/items.js";
import GameObject from "./game/GameObject.js";
import Projectile from "./game/projectile.js";
import Drone from "../../src/js/drone.js";
import Weapon from "../../src/js/weapon.js";
import Shape from "../../src/js/shape.js";

/** @type {Player[]} */

export const players = [];

/** @type {GameObject[]} */

export const buildings = [];

/** @type {Projectile[]} */

export const projectiles = [];

/** @type {Drone[]} */

export const drones = [];

var gameUpdateLoop;
var healingBeaconLoop;
var beaconPointsLoop;

/**
 * @param {Player} player 
 * @returns {{ name: string, maxammo: number, ammo: number, imageSource: string }[]}
 */

function groupWeapons(player) {
    let data = [];
    let shape = player.shapes[player.chooseIndex];

    if (shape) {
        for (let i = 0; i < shape.weapons.length; i++) {
            let wpn = shape.weapons[i];

            data.push({
                name: wpn.name,
                maxammo: wpn.maxammo,
                ammo: wpn.ammo,
                imageSource: wpn.imageSource
            });
        }
    }

    return data;
}

class ScoreCounter {
    constructor(name, data, isWin) {
        data.dmg = Math.floor(data.dmg);

        this.name = name;
        this.results = [];

        this.honor = data.kills * 7;
        this.results.push([data.kills * 7, "Every shape destroyed"]);

        this.honor += Math.floor(data.kills / 3) * 7;
        this.results.push([Math.floor(data.kills / 3) * 7, "Every 3 shapes destroyed"]);

        this.honor += Math.floor(data.kills / 6) * 20;
        this.results.push([Math.floor(data.kills / 6) * 20, "Every 6 shapes destroyed"]);

        this.kills = data.kills;
        this.dmg = data.dmg;
        this.beacons = data.beacons;

        this.honor += data.beacons * 15;
        this.results.push([data.beacons * 15, "Every beacon captured"]);

        this.honor += Math.floor(data.beacons / 4) * 20;
        this.results.push([Math.floor(data.beacons / 4) * 20, "Every 4 beacons captured"]);

        if (isWin) {
            this.honor += 300;
            this.results.push([300, "Winning the match"]);
        }

        this.honor += Math.ceil(data.dmg / 5e3);
        this.results.push([Math.ceil(data.dmg / 5e3), "Every 5k damage dealt"]);

        this.honor += Math.floor(data.dmg / 100e3) * 5;
        this.results.push([Math.floor(data.dmg / 100e3) * 5, "Every 100k damage dealt"]);
    }

    static rewardHighestDamage(players) {
        let sorted = players.sort((a, b) => b.dmg - a.dmg);

        let rewared = [300, 150, 50];
        let placement = ["1st", "2nd", "3rd"];

        for (let i = 0; i < 3; i++) {
            sorted[i].honor += rewared[i];
            sorted[i].results.push([rewared[i], `Reaching ${placement[i]} place in top damage`]);
        }
    }

    static rewardHighestBeacons(players) {
        let sorted = players.sort((a, b) => b.beacons - a.beacons);

        let rewared = [300, 200, 100];
        let placement = ["1st", "2nd", "3rd"];

        for (let i = 0; i < 3; i++) {
            sorted[i].honor += rewared[i];
            sorted[i].results.push([rewared[i], `Reaching ${placement[i]} place in top beacons captured`]);
        }
    }

    static rewardHighestKills(players) {
        let sorted = players.sort((a, b) => b.kills - a.kills);

        let rewared = [200, 150, 100];
        let placement = ["1st", "2nd", "3rd"];

        for (let i = 0; i < 3; i++) {
            sorted[i].honor += rewared[i];
            sorted[i].results.push([rewared[i], `Reaching ${placement[i]} place in top kills`]);
        }
    }
}

/**
 * @param {boolean} isWin 
 * @param {string} reason 
 */

function endGame(isWin, reason) {
    clearInterval(gameUpdateLoop);
    clearInterval(healingBeaconLoop);
    clearInterval(beaconPointsLoop);

    Game.map = null;
    Game.spawnIndx = 0;
    Game.points = [0, 0];

    onFirstStart = true;

    let allies = [];
    let enemies = [];

    for (let i = 0; i < players.length; i++) {
        players[i].moveDir = undefined;

        if (players[i].isAlly) {
            allies.push(new ScoreCounter(players[i].isUser == "me" ? "Player" : `Bot ${i}`, players[i].stats, isWin));
        } else {
            enemies.push(new ScoreCounter(`Bot ${i - 5}`, players[i].stats, !isWin));
        }
    }

    ScoreCounter.rewardHighestBeacons(allies);
    ScoreCounter.rewardHighestDamage(allies);
    ScoreCounter.rewardHighestKills(allies);

    ScoreCounter.rewardHighestBeacons(enemies);
    ScoreCounter.rewardHighestDamage(enemies);
    ScoreCounter.rewardHighestKills(enemies);

    Game.send(
        "endGame",
        allies.sort((a, b) => b.honor - a.honor),
        enemies.sort((a, b) => b.honor - a.honor),
        isWin,
        reason
    );

    projectiles.length = 0;
    players.length = 0;
    buildings.length = 0;
    drones.length = 0;
}

export function updatePlayerDisplay() {
    let allies = 0;
    let enemies = 0;

    for (let i = 0; i < players.length; i++) {
        let player = players[i];
        let shape = player.shapes[player.chooseIndex];

        if (player && shape && shape.health > 0) {
            if (player.isAlly) {
                allies++;
            } else {
                enemies++;
            }
        }
    }

    if (allies <= 0) {
        setTimeout(() => {
            endGame(false, "All ally shapes destroyed");
        }, 2e3);
    } else if (enemies <= 0) {
        setTimeout(() => {
            endGame(true, "All enemy shapes destroyed");
        }, 2e3);
    }

    Game.send("updatePlayerDisplay", allies, enemies);
}

/**
 * @param {number} e 
 * @returns {number}
 */

function randIntCoords(e) {
    return UTILS.randInt(e - 300, e + 300);
}

var onFirstStart = true;

var clientEvents = {
    "new": (data, isUser, leaguePoints) => {
        let indx = players.length;

        let tmp = new Player(data, isUser, Game, indx, leaguePoints);
        players.push(tmp);

        if (isUser == "me") {
            Game.start();
        } else {
            let shape = tmp.shapes[0];

            if (tmp.isAlly) {
                shape.x = randIntCoords(Game.map.locations[Game.spawnIndx].x);
                shape.y = randIntCoords(Game.map.locations[Game.spawnIndx].y);
            } else {
                shape.x = randIntCoords(Game.map.locations[+!Game.spawnIndx].x);
                shape.y = randIntCoords(Game.map.locations[+!Game.spawnIndx].y);
            }
        }
    },
    "chooseSlot": (slot) => {
        let player = players.find(e => e.isUser == "me");

        if (player) {
            player.chooseIndex = slot;

            let shape = player.shapes[slot];
            onFirstStart = false;

            shape.x = randIntCoords(Game.map.locations[Game.spawnIndx].x);
            shape.y = randIntCoords(Game.map.locations[Game.spawnIndx].y);

            Drone.activateDrones(player);

            Game.send("initializeWeapons", groupWeapons(player));
            updatePlayerDisplay();
        }
    },
    "updateMovement": (newMoveDir) => {
        let player = players.find(e => e.isUser == "me");

        if (player) player.moveDir = newMoveDir;
    },
    "pingSocket": () => {
        Game.send("pingSocket");
    },
    "setAttack": (indx) => {
        let player = players.find(e => e.isUser == "me");

        if (player) player.isAttacking = indx;
    },
    "reloadWeapons": () => {
        let player = players.find(e => e.isUser == "me");

        if (player) player.reloadAllWeapons = true;
    },
    "aim": (radian, mouseDistance) => {
        let player = players.find(e => e.isUser == "me");

        if (player) {
            player.targetDir = radian;

            player.mouseDistance = mouseDistance;
        }
    },
    "useAbility": (id) => {
        let player = players.find(e => e.isUser == "me");

        if (player) {
            let shape = player.shapes[player.chooseIndex];
            shape.useAbility(player, id, Game);
        }
    }
};

self.onmessage = (event) => {
    let { data } = event;

    if (typeof data == "string") {
    } else {
        data = new Uint8Array(data);
        let parsed = msgpack.decode(data);
        let type = parsed[0];
        data = parsed[1];

        if (clientEvents[type]) {
            clientEvents[type].apply(undefined, data);
        }
    }
};

export default class Game {

    /** @type {Map | null} */

    static map = null;
    static spawnIndx = 0;
    static points = [0, 0];

    static send(type) {
        let data = Array.prototype.slice.call(arguments, 1);
        let binary = msgpack.encode([type, data]);

        postMessage(binary);
    }

    static updateGame() {
        try {
            let playersData = [];
            let dronesData = [];

            for (let i = 0; i < players.length; i++) {
                let player = players[i];

                let shape = player.shapes[player.chooseIndex];

                if (shape) {
                    player.update(shape, this.map, buildings, players);

                    if (!shape.avoidBuildings) for (let t = 0; t < players.length; t++) {
                        let player = players[t];
                        let otherShape = player.shapes[player.chooseIndex];

                        if (otherShape && !otherShape.avoidBuildings && otherShape.health > 0 && shape != otherShape && UTILS.getDistance(shape, otherShape) <= shape.scale + otherShape.scale) {
                            let tmpScale = ((UTILS.getDistance(shape, otherShape) - (shape.scale + otherShape.scale)) * -1) / 2;
                            let tmpDir = UTILS.getDirection(shape, otherShape);

                            shape.x += (tmpScale * Math.cos(tmpDir));
                            shape.y += (tmpScale * Math.sin(tmpDir));
                            otherShape.x -= (tmpScale * Math.cos(tmpDir));
                            otherShape.y -= (tmpScale * Math.sin(tmpDir));
                        }
                    }
                }
            }

            for (let i = 0; i < drones.length; i++) {
                let drone = drones[i];

                if (drone.active) {
                    drone.update(config.gameUpdateSpeed);
                }
            }

            for (let i = 0; i < projectiles.length; i++) {
                let projectile = projectiles[i];

                if (projectile && projectile.active) {
                    projectile.update(players, true);

                    for (let t = 0; t < buildings.length; t++) {
                        let tmpObj = buildings[t];

                        if (tmpObj) {
                            if (tmpObj.name == "wall") {
                                if (projectile.x >= tmpObj.x - projectile.scale && projectile.x <= tmpObj.x + tmpObj.width + projectile.scale) {
                                    if (projectile.y >= tmpObj.y - projectile.scale && projectile.y <= tmpObj.y + tmpObj.height + projectile.scale) {
                                        let Px = Math.max(tmpObj.x + projectile.scale, Math.min(projectile.x, tmpObj.x + tmpObj.width - projectile.scale));
                                        let Py = Math.max(tmpObj.y + projectile.scale, Math.min(projectile.y, tmpObj.y + tmpObj.height - projectile.scale));

                                        if (UTILS.getDistance({ x: Px, y: Py }, projectile) <= projectile.scale * 2) {
                                            projectile.range = 0;
                                            break;
                                        }
                                    }
                                }
                            } else if (tmpObj.name == "healing beacon" && UTILS.getDistance(tmpObj, projectile) <= projectile.scale + 60) {
                                projectile.range = 0;
                                break;
                            }
                        }
                    }

                    let done = false;

                    for (let i = 0; i < players.length; i++) {
                        let player = players[i];

                        let shape = player.shapes[player.chooseIndex];
                        let doer = players[projectile.owner];

                        if (shape && shape.health > 0 && doer.isAlly != player.isAlly) {
                            if (shape.isPhaseShift()) continue;

                            let tmpScale = shape.scale;
                            let tmpSpeed = projectile.speed * config.gameUpdateSpeed;

                            if (UTILS.lineInRect(
                                shape.x - tmpScale,
                                shape.y - tmpScale,
                                shape.x + tmpScale,
                                shape.y + tmpScale,
                                projectile.x,
                                projectile.y,
                                projectile.x + (tmpSpeed * Math.cos(projectile.dir)),
                                projectile.y + (tmpSpeed * Math.sin(projectile.dir))
                            )) {
                                player.changeHealth(shape, -projectile.dmg, doer);
                                projectile.range = 0;
                                done = true;
                                break;
                            }
                        }
                    }

                    if (projectile.range <= 0) {
                        if (done) {
                            this.send("removeProjectile", projectile.sid, 200);
                        } else {
                            this.send("removeProjectile", projectile.sid);
                        }

                        projectiles.splice(i, 1);
                        i--;
                    }
                }
            }

            for (let i = 0; i < buildings.length; i++) {
                let tmpObj = buildings[i];

                if (tmpObj && tmpObj.name == "beacon") {
                    tmpObj.changing = false;

                    for (let t = 0; t < players.length; t++) {
                        let player = players[t];
                        let shape = player.shapes[player.chooseIndex];

                        if (shape && shape.isPhaseShift()) continue;

                        if (shape && UTILS.getDistance(shape, tmpObj) <= 400 + shape.scale) {
                            tmpObj.changing = true;

                            let tmpAdd = (player.isAlly ? 1 : -1);

                            if (tmpAdd == 1) {
                                tmpObj.capturePoints = Math.min(6e3, tmpObj.capturePoints + (tmpAdd * config.gameUpdateSpeed));
                            } else {
                                tmpObj.capturePoints = Math.max(-6e3, tmpObj.capturePoints + (tmpAdd * config.gameUpdateSpeed));
                            }

                            this.send("beaconUpdate", i, tmpObj.capturePoints);
                        }
                    }

                    if (Math.abs(tmpObj.capturePoints) == 6e3) {
                        if (!tmpObj.isCaptured) {
                            for (let t = 0; t < players.length; t++) {
                                let player = players[t];
                                let shape = player.shapes[player.chooseIndex];

                                if (shape && shape.isPhaseShift()) continue;

                                if (shape && UTILS.getDistance(shape, tmpObj) <= 400 + shape.scale) {
                                    if (tmpObj.capturePoints == -6e3 && player.isAlly) continue;
                                    if (tmpObj.capturePoints == 6e3 && !player.isAlly) continue;
                                    player.stats.beacons++;

                                    if (player.isUser == "me") {
                                        this.send("beaconCaptured", i);
                                    }
                                }
                            }

                            tmpObj.isCaptured = true;
                        }
                    } else {
                        if (tmpObj.isCaptured && Math.abs(tmpObj.capturePoints) <= 100) {
                            tmpObj.isCaptured = false;
                        }
                    }

                    if (!tmpObj.changing) {
                        if (tmpObj.capturePoints != 0 && Math.abs(tmpObj.capturePoints) != 6e3) {
                            let wasNeg = tmpObj.capturePoints < 0 ? -1 : 1;

                            if (Math.abs(tmpObj.capturePoints) <= 60) {
                                tmpObj.capturePoints = 0;
                            } else {
                                tmpObj.capturePoints -= (6e3 / config.gameUpdateSpeed) * wasNeg * .25;
                            }

                            this.send("beaconUpdate", i, tmpObj.capturePoints);
                        }
                    }
                }
            }

            for (let i = 0; i < players.length; i++) {
                let player = players[i];
                let shape = player.shapes[player.chooseIndex];

                if (shape) {
                    // ID, ISUSER, name, x, y, dir, health, maxhealth, grayDamage, isAlly, zIndex
                    if (shape.health > 0) playersData.push(player.sid, player.isUser, shape.name, shape.x, shape.y, shape.dir, shape.health, shape.maxhealth, shape.grayDamage, player.isAlly, shape.zIndex);
                }
            }

            for (let i = 0; i < drones.length; i++) {
                let drone = drones[i];

                if (drone.active) {
                    // SID, NAME, X, Y
                    dronesData.push(i, drone.name, drone.x, drone.y, drone.owner.zIndex);
                }
            }

            this.send("updatePlayers", playersData);
            this.send("updateDrones", dronesData);
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} dir 
     * @param {Shape} owner 
     * @param {Weapon} wpn 
     * @param {number} extraSpeed 
     */

    static addProjectile(x, y, dir, owner, wpn, extraSpeed) {
        let tmp = new Projectile(x, y, wpn.name, wpn.projectileId, wpn.range, dir, owner, wpn.dmg)
        projectiles.push(tmp);

        let { name, range, projectileId } = wpn;
        let { sid } = tmp;

        this.send("addProjectile", x, y, dir, owner, { name, range, projectileId, sid, extraSpeed });
    }

    static start() {
        try {
            let gameTimer = 1e3 * 60 * 5;

            let map = this.map = MapBuilder.build();
            this.spawnIndx = Math.floor(Math.random() * 2);

            this.send("init", map, buildings);

            for (let i = 0; i < 2; i++) this.send("updateBeaconBars", i, 0);

            beaconPointsLoop = setInterval(() => {
                if (onFirstStart) return;

                for (let i = 0; i < buildings.length; i++) {
                    let tmpObj = buildings[i];

                    if (tmpObj.name == "beacon") {
                        if (Math.abs(tmpObj.capturePoints) == 6e3) {
                            let indx = (tmpObj.capturePoints == -6e3) * 1;

                            this.points[indx] = Math.min(this.points[indx] + 1, 300);
                            this.send("updateBeaconBars", indx, this.points[indx]);

                            tmpObj.collectionTime = 1e3;
                        }
                    }
                }
            }, 1500);

            healingBeaconLoop = setInterval(() => { // healing beacon
                if (onFirstStart) return;

                for (let i = 0; i < buildings.length; i++) {
                    let tmpObj = buildings[i];

                    if (tmpObj.name == "healing beacon") {
                        for (let i = 0; i < players.length; i++) {
                            let player = players[i];

                            let shape = player.shapes[player.chooseIndex];

                            if (shape && UTILS.getDistance(tmpObj, shape) <= tmpObj.scale + shape.scale) {
                                player.changeHealth(shape, tmpObj.power);
                            }
                        }
                    }
                }
            }, 2e3);

            gameUpdateLoop = setInterval(() => {
                if (onFirstStart) return;

                gameTimer -= config.gameUpdateSpeed;

                if (gameTimer <= 0) {
                    let isWin = true;
                    let reason = "Time has run out. Your team has more beacon points and thus wins the match.";

                    if (this.points[0] < this.points[1]) {
                        isWin = false;
                        reason = "Time has run out. The opposing team has more beacon points, and you lose the match.";
                    } else if (this.points[0] == this.points[1]) {
                        isWin = false;
                        reason = "Tied. Both teams have the same amount of captured beacon points.";
                    }

                    endGame(isWin, reason);
                    return;
                } else {
                    let isWin = true;
                    let reason = "";

                    if (this.points[0] >= 300 && this.points[0] == this.points[1]) {
                        isWin = false;
                        reason = "Tied. Both teams have the same amount of captured beacon points.";
                    } else if (this.points[0] >= 300) {
                        reason = "Successfully captured the 300 required beacon points for our research.";
                    } else if (this.points[1] >= 300) {
                        isWin = false;
                        reason = "Lose. The enemy team has captured the required 300 beacon points for their research.";
                    }

                    if (reason) {
                        endGame(isWin, reason);
                        return;
                    }
                }


                this.updateGame();
            }, config.gameUpdateSpeed);
        } catch (e) {
            console.log(e);
        }
    }
};