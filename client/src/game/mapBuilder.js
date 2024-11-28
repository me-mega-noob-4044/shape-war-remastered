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
    build(buildings) {
        let indx = Math.floor(Math.random() * maps.length);
        let map = maps[indx];

        if (indx == 0) {
            buildings.push({
                name: "beacon",
                x: 1700,
                y: map.height * .75,
                capturePoints: 0
            });

            buildings.push({
                name: "beacon",
                x: map.width / 2,
                y: map.height * .25,
                capturePoints: 0
            });

            buildings.push({
                name: "beacon",
                x: map.width / 2,
                y: map.height * .75,
                capturePoints: 0
            });

            buildings.push({
                name: "beacon",
                x: 6300,
                y: map.height * .25,
                capturePoints: 0
            });
        }

        return map;
    }
};

export { maps, mapBuilder };