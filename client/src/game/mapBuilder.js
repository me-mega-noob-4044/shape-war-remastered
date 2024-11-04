const maps = [{
    name: "Bastion",
    width: 12e3,
    height: 6e3
}];

var mapBuilder = new class {
    build() {
        return maps[0];
    }
};

export { maps, mapBuilder };