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
                layer: 0,
                x: 1700,
                y: map.height * .75,
                capturePoints: 0
            });

            buildings.push({
                name: "beacon",
                layer: 0,
                x: map.width / 2,
                y: map.height * .25,
                capturePoints: 0
            });

            buildings.push({
                name: "beacon",
                layer: 0,
                x: map.width / 2,
                y: map.height * .75,
                capturePoints: 0
            });

            buildings.push({
                name: "beacon",
                layer: 0,
                x: 6300,
                y: map.height * .25,
                capturePoints: 0
            });

            buildings.push({
                name: "wall",
                layer: 1,
                width: 1800,
                height: 300,
                x: map.width / 2 - 900,
                y: map.height / 2 - 150,
                capturePoints: 0
            });
        }

        return map;
    }
};

export { maps, mapBuilder };