import msgpack from "../../src/js/msgpack.js";

self.onmessage = (event) => {
    let { data } = event;

    if (typeof data == "string") {

    } else {
        data = new Uint8Array(data);
        let parsed = msgpack.decode(data);
        let type = parsed[0];
        data = parsed[1];
    }
};