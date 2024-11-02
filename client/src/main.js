import msgpack from "../../src/js/msgpack.js";
import player from "../../src/js/player.js";
import { maps, mapBuilder } from "./game/mapBuilder.js";
import config from "../../src/js/config.js";

var players = [];
var buildings = [];
var mapSize = {
    width: 0, // X axis
    height: 0 // Y axis
};

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
        players.push(new player(data, isUser, game));

        if (isUser) {
            game.start();
        }
    },
    "chooseSlot": (slot) => {
        if (players[0]) {
            players[0].chooseIndex = slot;

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
        this.interval = null;
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
                player.update(shape, this.map);

                // ID, name, x, y, dir, health, maxhealth, grayDamage
                playersData.push(i, shape.name, shape.x, shape.y, shape.dir, shape.health, shape.maxhealth, shape.grayDamage);
            }
        }

        this.send("updatePlayers", playersData);
    }

    start() {
        let map = this.map = mapBuilder.build(buildings);

        this.send("init", map, buildings);

        this.interval = setInterval(() => {
            this.updateGame();
        }, config.gameUpdateSpeed);
    }
};