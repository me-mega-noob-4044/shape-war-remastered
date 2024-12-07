import msgpack from "../../src/js/msgpack.js";
import player from "../../src/js/player.js";
import { maps, mapBuilder } from "./game/mapBuilder.js";
import config from "../../src/js/config.js";
import projectile from "./game/projectile.js";
import * as UTILS from "../../src/js/utils.js";

var players = [];
var buildings = [];
var projectiles = [];

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

function updatePlayerDisplay() {
    let allies = 0;
    let enemies = 0;

    for (let i = 0; i < players.length; i++) {
        let player = players[i];

        if (player) {
            if (player.isAlly) {
                allies++;
            } else {
                enemies++;
            }
        }
    }

    game.send("updatePlayerDisplay", allies, enemies);
}

function randIntCoords(e) {
    return UTILS.randInt(e - 300, e + 300);
}

var clientEvents = {
    "new": (data, isUser) => {
        let indx = players.length;

        let tmp = new player(data, isUser, game, indx);
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
                    player.update(shape, this.map, buildings);

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
                    playersData.push(player.sid, shape.name, shape.x, shape.y, shape.dir, shape.health, shape.maxhealth, shape.grayDamage, player.isAlly);
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

                            if (tmpAdd) {
                                tmpObj.capturePoints = Math.min(6e3, tmpObj.capturePoints + (tmpAdd * config.gameUpdateSpeed));
                            } else {
                                tmpObj.capturePoints = Math.max(6e3, tmpObj.capturePoints + (tmpAdd * config.gameUpdateSpeed));
                            }

                            this.send("beaconUpdate", i, tmpObj.capturePoints);
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

        setInterval(() => {
            for (let i = 0; i < buildings.length; i++) {
                let tmpObj = buildings[i];

                if (tmpObj.name == "beacon") {
                    if (Math.abs(tmpObj.capturePoints) == 6e3) {
                        let indx = (tmpObj.capturePoints == -6) * 1;

                        this.points[indx] = Math.min(this.points[indx] + 1, 300);
                        this.send("updateBeaconBars", indx, this.points[indx]);

                        tmpObj.collectionTime = 1e3;
                    }
                }
            }
        }, 1e3);

        setInterval(() => { // healing beacon
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

        setInterval(() => {
            this.updateGame();
        }, config.gameUpdateSpeed);
    }
};