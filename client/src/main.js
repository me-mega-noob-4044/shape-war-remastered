import msgpack from "../../src/js/msgpack.js";
import player from "../../src/js/player.js";

var players = [];

var clientEvents = {
    "new": (data) => {
        players.push(new player(data));
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