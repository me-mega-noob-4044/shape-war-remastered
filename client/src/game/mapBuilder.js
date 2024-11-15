const maps = [{
    name: "Bastion",
    width: 8e3,
    height: 4e3,
    locations: [{
        x: 500,
        y: 3e3
    }, {
        x: 7500,
        y: 2e3
    }]
}];

var mapBuilder = new class {
    build() {
        return maps[0];
    }
};

export { maps, mapBuilder };