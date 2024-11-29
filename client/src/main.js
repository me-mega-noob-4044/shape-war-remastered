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

var clientEvents = {
    "new": (data, isUser) => {
        let indx = players.length;

        players.push(new player(data, isUser, game, indx));

        if (isUser) {
            game.start();
        }
    },
    "chooseSlot": (slot) => {
        if (players[0]) {
            players[0].chooseIndex = slot;

            let shape = players[0].shapes[slot];

            if (players[0].isAlly) {
                shape.x = game.map.locations[game.spawnIndx].x;
                shape.y = game.map.locations[game.spawnIndx].y;
            } else {
                shape.x = game.map.locations[+!game.spawnIndx].x;
                shape.y = game.map.locations[+!game.spawnIndx].y;
            }

            game.send("initializeWeapons", groupWeapons(players[0]));
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
        let playersData = [];

        for (let i = 0; i < players.length; i++) {
            let player = players[i];

            let shape = player.shapes[player.chooseIndex];

            if (shape) {
                player.update(shape, this.map, buildings);

                // ID, name, x, y, dir, health, maxhealth, grayDamage
                playersData.push(i, shape.name, shape.x, shape.y, shape.dir, shape.health, shape.maxhealth, shape.grayDamage);
            }
        }

        for (let i = 0; i < projectiles.length; i++) {
            let projectile = projectiles[i];

            if (projectile && projectile.active) {
                projectile.update(players, true);

                for (let t = 0; t < buildings.length; t++) {
                    let tmpObj = buildings[t];

                    if (tmpObj && tmpObj.name == "wall") {
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
                    }
                }

                if (projectile.range <= 0) {
                    this.send("removeProjectile", projectile.sid);
                    projectiles.splice(i, 1);
                    i--;
                }
            }
        }

        this.send("updatePlayers", playersData);
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

        setInterval(() => { // healing beacon
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