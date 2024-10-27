import msgpack from "../../src/js/msgpack.js";
import player from "../../src/js/player.js";
import mapBuilder from "./game/mapBuilder.js";
import config from "../../src/js/config.js";

var players = [];
var buildings = [];

var clientEvents = {
    "new": (data, isUser) => {
        players.push(new player(data, isUser));

        if (isUser) {
            game.start();
        }
    }
};

self.onmessage = (event) => {
    let { data } = event;

    if (typeof data == "string") {
        // 
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
        this.interval = null;
    }

    send(type) {
        let data = Array.prototype.slice.call(arguments, 1);
        let binary = msgpack.encode([type, data]);

        postMessage(binary);
    }

    buildMap() {
        
    }
    
    updateGame() {}

    start() {
        mapBuilder.build(buildings);

        this.send("init");

        this.interval = setInterval(() => {
            this.updateGame();
        }, config.gameUpdateSpeed);
    }
};