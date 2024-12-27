import msgpack from "../../src/js/msgpack.js";
import player from "../../src/js/player.js";
import { maps, mapBuilder } from "./game/mapBuilder.js";
import config from "../../src/js/config.js";
import projectile from "./game/projectile.js";
import * as UTILS from "../../src/js/utils.js";

export const players = [];
export const buildings = [];
export const projectiles = [];

var gameUpdateLoop;
var healingBeaconLoop;
var beaconPointsLoop;

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

        this.kills = data.kills;
        this.dmg = data.dmg;
        this.beacons = data.beacons;

        this.honor += data.beacons * 20;
        this.results.push([data.beacons * 20, "Beacon captured"]);

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
            sorted[i].push([rewared[i], `Reaching ${placement[i]} place in top damage`]);
        }
    }

    static rewardHighestBeacons(players) {
        let sorted = players.sort((a, b) => b.beacons - a.beacons);

        let rewared = [300, 200, 100];
        let placement = ["1st", "2nd", "3rd"];

        for (let i = 0; i < 3; i++) {
            sorted[i].honor += rewared[i];
            sorted[i].push([rewared[i], `Reaching ${placement[i]} place in top beacons captured`]);
        }
    }

    static rewardHighestKills(players) {
        let sorted = players.sort((a, b) => b.kills - a.kills);

        let rewared = [200, 150, 100];
        let placement = ["1st", "2nd", "3rd"];

        for (let i = 0; i < 3; i++) {
            sorted[i].honor += rewared[i];
            sorted[i].push([rewared[i], `Reaching ${placement[i]} place in top kills`]);
        }
    }
}

function endGame(isWin, reason) {
    clearInterval(gameUpdateLoop);
    clearInterval(healingBeaconLoop);
    clearInterval(beaconPointsLoop);

    let allies = [];
    let enemies = [];

    for (let i = 0; i < players.length; i++) {
        players[i].moveDir = undefined;
        if (players[i].isAlly) {
            allies.push(new ScoreCounter(players[i].isUser == "me" ? "player" : `Bot ${i}` , players[i].stats, isWin));
        } else {
            enemies.push(new ScoreCounter(`Bot ${i - 4}`, players[i].stats, !isWin));
        }
    }

    ScoreCounter.rewardHighestBeacons(allies);
    ScoreCounter.rewardHighestDamage(allies);
    ScoreCounter.rewardHighestKills(allies);

    ScoreCounter.rewardHighestBeacons(enemies);
    ScoreCounter.rewardHighestDamage(enemies);
    ScoreCounter.rewardHighestKills(enemies);

    game.send(
        "endGame",
        allies.sort((a, b) => b.honor - a.honor),
        enemies.sort((a, b) => b.honor - a.honor),
        isWin,
        reason
    );
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

    game.send("updatePlayerDisplay", allies, enemies);
}

function randIntCoords(e) {
    return UTILS.randInt(e - 300, e + 300);
}

var onFirstStart = true;

var clientEvents = {
    "new": (data, isUser, leaguePoints) => {
        let indx = players.length;

        let tmp = new player(data, isUser, game, indx, leaguePoints);
        players.push(tmp);

        if (isUser == "me") {
            game.start();
        } else {
            let shape = tmp.shapes[0];

            if (tmp.isAlly) {
                shape.x = randIntCoords(game.map.locations[game.spawnIndx].x);
                shape.y = randIntCoords(game.map.locations[game.spawnIndx].y);
            } else {
                shape.x = randIntCoords(game.map.locations[+!game.spawnIndx].x);
                shape.y = randIntCoords(game.map.locations[+!game.spawnIndx].y);
            }
        }
    },
    "chooseSlot": (slot) => {
        if (players[0]) {
            players[0].chooseIndex = slot;

            let shape = players[0].shapes[slot];

            onFirstStart = false;

            if (players[0].isAlly) {
                shape.x = randIntCoords(game.map.locations[game.spawnIndx].x);
                shape.y = randIntCoords(game.map.locations[game.spawnIndx].y);
            } else {
                shape.x = randIntCoords(game.map.locations[+!game.spawnIndx].x);
                shape.y = randIntCoords(game.map.locations[+!game.spawnIndx].y);
            }

            game.send("initializeWeapons", groupWeapons(players[0]));
            updatePlayerDisplay();
        }
    },
    "updateMovement": (newMoveDir) => {
        if (players[0]) players[0].moveDir = newMoveDir;
    },
    "pingSocket": () => {
        game.send("pingSocket");
    },
    "setAttack": (indx) => {
        if (players[0]) players[0].isAttacking = indx;
    },
    "reloadWeapons": () => {
        if (players[0]) players[0].reloadAllWeapons = true;
    },
    "aim": (radian, mouseDistance) => {
        if (players[0]) {
            players[0].targetDir = radian;

            players[0].mouseDistance = mouseDistance;
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

var game = new class {
    constructor() {
        this.map = null;
        this.spawnIndx = 0;
        this.points = [0, 0];
    }

    send(type) {
        let data = Array.prototype.slice.call(arguments, 1);
        let binary = msgpack.encode([type, data]);

        postMessage(binary);
    }

    buildMap() {
        
    }
    
    updateGame() {
        try {
            let playersData = [];

            for (let i = 0; i < players.length; i++) {
                let player = players[i];
    
                let shape = player.shapes[player.chooseIndex];

                if (shape) {
                    player.update(shape, this.map, buildings, players);

                    for (let t = 0; t < players.length; t++) {
                        let player = players[t];
                        let otherShape = player.shapes[player.chooseIndex];

                        if (otherShape && otherShape.health > 0 && shape != otherShape && UTILS.getDistance(shape, otherShape) <= shape.scale + otherShape.scale) {
                            let tmpScale = ((UTILS.getDistance(shape, otherShape) - (shape.scale + otherShape.scale)) * -1) / 2;
                            let tmpDir = UTILS.getDirection(shape, otherShape);

                            shape.x += (tmpScale * Math.cos(tmpDir));
                            shape.y += (tmpScale * Math.sin(tmpDir));
                            otherShape.x -= (tmpScale * Math.cos(tmpDir));
                            otherShape.y -= (tmpScale * Math.sin(tmpDir));
                        }
                    }
    
                    // ID, name, x, y, dir, health, maxhealth, grayDamage, isAlly
                    if (shape.health > 0) playersData.push(player.sid, shape.name, shape.x, shape.y, shape.dir, shape.health, shape.maxhealth, shape.grayDamage, player.isAlly);
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

            this.send("updatePlayers", playersData);
        } catch(e) {
            console.log(e);
        }
    }

    addProjectile(x, y, dir, owner, wpn, extraSpeed) {
        let tmp = new projectile(x, y, wpn.name, wpn.projectileId, wpn.range, dir, owner, wpn.dmg)
        projectiles.push(tmp);

        let { name, range, projectileId } = wpn;
        let { sid } = tmp;

        this.send("addProjectile", x, y, dir, owner, { name, range,  projectileId, sid, extraSpeed });
    }

    start() {
        let map = this.map = mapBuilder.build(buildings);
        this.spawnIndx = Math.floor(Math.random() * 2);

        this.send("init", map, buildings);

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
        }, 1e3);

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

            this.updateGame();
        }, config.gameUpdateSpeed);
    }
};