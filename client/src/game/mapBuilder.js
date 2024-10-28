const maps = [{
    name: "Plain Field",
    width: 3e3,
    height: 3e3
}];

var mapBuilder = new class {
    build() {
        return maps[0];
    }
};

export { maps, mapBuilder };