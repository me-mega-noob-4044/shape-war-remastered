const maps = [{
    name: "Bastion",
    width: 8e3,
    height: 4e3,
    locations: [{
        x: 500,
        y: 2e3
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
                y: map.height / 2 - 150
            });

            buildings.push({
                name: "wall",
                layer: 1,
                width: 800,
                height: 800,
                x: 5100,
                y: 2600
            });

            buildings.push({
                name: "wall",
                layer: 1,
                width: 300,
                height: 1300,
                x: 5100,
                y: 0
            });

            buildings.push({
                name: "wall",
                layer: 1,
                width: 400,
                height: 400,
                x: 5400,
                y: 1700
            });

            buildings.push({
                name: "wall",
                layer: 1,
                width: 400,
                height: 2400,
                x: 1500,
                y: 0
            });

            buildings.push({
                name: "healing beacon",
                layer: 2,
                x: 2500,
                y: 350,
                power: 1e3,
                scale: 450
            });

            buildings.push({
                name: "healing beacon",
                layer: 2,
                x: 5250,
                y: 4000,
                power: 6e3,
                scale: 750
            });
        }

        return map;
    }
};

export { maps, mapBuilder };